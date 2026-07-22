-- Views de apoio ao dashboard admin: receita do mês e alunas ativas por mês.

create or replace view public.receita_mensal as
select
  competencia,
  sum(valor_centavos) filter (where status = 'pago') as receita_paga_centavos,
  sum(valor_centavos) filter (where status in ('pendente', 'vencido')) as receita_em_aberto_centavos,
  count(*) filter (where status = 'pago') as qtd_pagas,
  count(distinct aluna_id) as qtd_alunas
from public.mensalidades
group by competencia
order by competencia desc;

comment on view public.receita_mensal is
  'Receita agregada por competência (mês). Base para o card de receita total do mês no dashboard admin.';

create or replace view public.alunas_ativas_mensal as
select
  m.competencia,
  count(distinct m.aluna_id) as alunas_ativas
from public.mensalidades m
where m.status in ('pago', 'pendente')
group by m.competencia
order by m.competencia desc;

comment on view public.alunas_ativas_mensal is
  'Conta alunas com mensalidade pendente ou paga em cada competência = ativas naquele mês.';

alter view public.receita_mensal owner to postgres;
alter view public.alunas_ativas_mensal owner to postgres;

grant select on public.receita_mensal to authenticated;
grant select on public.alunas_ativas_mensal to authenticated;
