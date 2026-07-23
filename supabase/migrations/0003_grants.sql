-- A migration 0001 habilitou RLS mas nunca concedeu o GRANT de base nas
-- tabelas para as roles do PostgREST. RLS só filtra linhas; sem o GRANT,
-- o Postgres nega a query inteira antes mesmo de avaliar as policies.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.planos to authenticated;
grant select, insert, update, delete on public.mensalidades to authenticated;
grant select on public.mensagens_enviadas to authenticated;
