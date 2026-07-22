-- One Fight Studio — schema inicial
-- Convenção: tudo em português (nomes de colunas/tabelas) para casar com o domínio do negócio.

create extension if not exists "pgcrypto";

-- =========================================================
-- PROFILES (1:1 com auth.users). Guarda dados pessoais + role.
-- =========================================================
create type public.papel as enum ('aluna', 'admin');
create type public.modalidade as enum ('personal', 'grupo', 'totalpass_wellhub');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text not null,
  telefone text, -- formato E.164, ex: +5511999999999 (usado no envio WhatsApp)
  data_nascimento date,
  papel public.papel not null default 'aluna',
  modalidade public.modalidade,
  foto_antes_url text,
  foto_atual_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- =========================================================
-- PLANOS — valores configuráveis pelo admin (personal, grupo, etc)
-- Histórico de preço fica preservado: nunca dá update no valor de um
-- plano vigente, cria-se um novo registro com vigencia_inicio nova.
-- Isso mantém a receita de meses passados correta mesmo se o preço mudar.
-- =========================================================
create table public.planos (
  id uuid primary key default gen_random_uuid(),
  modalidade public.modalidade not null,
  nome text not null, -- ex: "Aula em grupo", "Personal 2x/semana"
  valor_centavos integer not null check (valor_centavos >= 0),
  vigencia_inicio date not null default current_date,
  vigencia_fim date, -- null = vigente
  criado_em timestamptz not null default now()
);

create index idx_planos_modalidade_vigencia on public.planos (modalidade, vigencia_inicio desc);

-- =========================================================
-- MENSALIDADES — vencimento e pagamento de cada aluna, mês a mês.
-- Base para: "consultar vencimento", "aviso de vencido via WhatsApp",
-- "receita total do mês", "quantas alunas ativas por mês".
-- =========================================================
create type public.status_mensalidade as enum ('pendente', 'pago', 'vencido', 'cancelado');

create table public.mensalidades (
  id uuid primary key default gen_random_uuid(),
  aluna_id uuid not null references public.profiles(id) on delete cascade,
  plano_id uuid references public.planos(id),
  competencia date not null, -- primeiro dia do mês de referência, ex: 2026-07-01
  valor_centavos integer not null check (valor_centavos >= 0),
  vencimento date not null,
  pago_em timestamptz,
  status public.status_mensalidade not null default 'pendente',
  criado_em timestamptz not null default now(),
  unique (aluna_id, competencia)
);

create index idx_mensalidades_vencimento on public.mensalidades (vencimento);
create index idx_mensalidades_status on public.mensalidades (status);
create index idx_mensalidades_competencia on public.mensalidades (competencia);

-- =========================================================
-- LOG DE MENSAGENS WHATSAPP — evita duplicar envio no mesmo dia
-- (o cron roda diariamente e precisa ser idempotente).
-- =========================================================
create type public.tipo_mensagem as enum ('vencimento', 'aniversario');

create table public.mensagens_enviadas (
  id uuid primary key default gen_random_uuid(),
  aluna_id uuid not null references public.profiles(id) on delete cascade,
  tipo public.tipo_mensagem not null,
  referencia date not null, -- dia de vencimento ou data do aniversário no ano corrente
  enviado_em timestamptz not null default now(),
  unique (aluna_id, tipo, referencia)
);

-- =========================================================
-- updated_at automático em profiles
-- =========================================================
create or replace function public.set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_atualizado_em
  before update on public.profiles
  for each row execute function public.set_atualizado_em();

-- =========================================================
-- Cria profile automaticamente quando um usuário se cadastra
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome_completo)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome_completo', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.profiles enable row level security;
alter table public.planos enable row level security;
alter table public.mensalidades enable row level security;
alter table public.mensagens_enviadas enable row level security;

-- helper: verifica se o usuário logado é admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and papel = 'admin'
  );
$$ language sql security definer stable;

-- profiles: aluna vê/edita só o próprio registro; admin vê/edita todos
create policy "profiles: aluna vê o próprio" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles: aluna atualiza o próprio" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

create policy "profiles: admin insere" on public.profiles
  for insert with check (public.is_admin());

-- planos: todos autenticados podem ler (para exibir valor), só admin edita
create policy "planos: leitura autenticada" on public.planos
  for select using (auth.role() = 'authenticated');

create policy "planos: admin gerencia" on public.planos
  for all using (public.is_admin()) with check (public.is_admin());

-- mensalidades: aluna vê só as próprias, só admin edita
create policy "mensalidades: aluna vê a própria" on public.mensalidades
  for select using (auth.uid() = aluna_id or public.is_admin());

create policy "mensalidades: admin gerencia" on public.mensalidades
  for all using (public.is_admin()) with check (public.is_admin());

-- mensagens_enviadas: só admin (uso interno do cron via service role)
create policy "mensagens_enviadas: admin lê" on public.mensagens_enviadas
  for select using (public.is_admin());

-- =========================================================
-- STORAGE — bucket de fotos (antes/atual), privado
-- =========================================================
insert into storage.buckets (id, name, public)
values ('fotos-alunas', 'fotos-alunas', false)
on conflict (id) do nothing;

create policy "fotos: aluna lê a própria pasta"
  on storage.objects for select
  using (
    bucket_id = 'fotos-alunas'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "fotos: aluna faz upload na própria pasta"
  on storage.objects for insert
  with check (
    bucket_id = 'fotos-alunas'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "fotos: aluna atualiza a própria pasta"
  on storage.objects for update
  using (
    bucket_id = 'fotos-alunas'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
