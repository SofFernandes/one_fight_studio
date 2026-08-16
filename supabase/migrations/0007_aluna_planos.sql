-- Vínculo many-to-many entre alunas e planos: uma aluna pode ter vários planos
-- vigentes ao mesmo tempo (ex: Grupo + Personal). A vigência do vínculo é
-- implicitamente a vigência do próprio plano (planos.vigencia_fim) — não há
-- campo de vigência aqui, evitando duas fontes de verdade para sincronizar.
create table public.aluna_planos (
  aluna_id uuid not null references public.profiles(id) on delete cascade,
  plano_id uuid not null references public.planos(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (aluna_id, plano_id)
);

grant select, insert, update, delete on public.aluna_planos to authenticated;
grant select, insert, update, delete on public.aluna_planos to service_role;

alter table public.aluna_planos enable row level security;

create policy "aluna_planos: aluna vê o próprio vínculo" on public.aluna_planos
  for select using (auth.uid() = aluna_id or public.is_admin());

create policy "aluna_planos: admin gerencia" on public.aluna_planos
  for all using (public.is_admin()) with check (public.is_admin());
