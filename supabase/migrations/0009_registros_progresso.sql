alter table public.profiles
  drop column if exists foto_antes_url,
  drop column if exists foto_atual_url;

create table public.registros_progresso (
  id uuid primary key default gen_random_uuid(),
  aluna_id uuid not null references public.profiles(id) on delete cascade,
  data_registro date not null default current_date,
  foto_url text,
  peso_kg numeric(5,2) check (peso_kg is null or peso_kg > 0),
  altura_cm smallint check (altura_cm is null or altura_cm > 0),
  criado_em timestamptz not null default now(),
  constraint conteudo_obrigatorio check (
    foto_url is not null or peso_kg is not null or altura_cm is not null
  )
);

create index idx_registros_progresso_aluna_data
  on public.registros_progresso (aluna_id, data_registro desc);

grant select, insert, update, delete on public.registros_progresso to authenticated;
grant select, insert, update, delete on public.registros_progresso to service_role;

alter table public.registros_progresso enable row level security;

create policy "registros_progresso: aluna vê o próprio" on public.registros_progresso
  for select using (auth.uid() = aluna_id or public.is_admin());

create policy "registros_progresso: aluna gerencia o próprio" on public.registros_progresso
  for all using (auth.uid() = aluna_id or public.is_admin())
  with check (auth.uid() = aluna_id or public.is_admin());
