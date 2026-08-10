comment on type public.status_mensalidade is
  'Valores possíveis: pendente, pago, cancelado (escritos pela aplicação). '
  'O valor "vencido" é mantido apenas por compatibilidade retroativa — '
  'NÃO é mais escrito automaticamente. "Vencida" agora é um estado DERIVADO '
  'em tempo de leitura (pendente + vencimento < hoje), calculado em lib/mensalidades.ts.';
