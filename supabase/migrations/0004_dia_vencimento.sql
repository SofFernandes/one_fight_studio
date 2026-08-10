alter table public.profiles
  add column dia_vencimento smallint check (dia_vencimento between 1 and 28);

comment on column public.profiles.dia_vencimento is
  'Dia fixo do mês (1-28) em que a mensalidade da aluna vence, recorrente. '
  'Limitado a 28 para existir em todos os meses (evita casos de fev/abr/etc).';
