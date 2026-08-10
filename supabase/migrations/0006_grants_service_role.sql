-- service_role deveria ter bypass total por padrão, mas esse projeto nunca
-- concedeu o GRANT de base explícito para essa role (só para "authenticated"
-- em 0003_grants.sql). Sem o GRANT, PostgREST nega a query antes mesmo de
-- considerar bypassRLS — necessário para o cron (lib/supabase/admin.ts,
-- que usa a service role key) conseguir ler/escrever em profiles/mensalidades.
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.planos to service_role;
grant select, insert, update, delete on public.mensalidades to service_role;
grant select, insert, update, delete on public.mensagens_enviadas to service_role;
