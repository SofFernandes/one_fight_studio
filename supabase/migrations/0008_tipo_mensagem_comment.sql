comment on table public.mensagens_enviadas is
  'Log de idempotência do cron de WhatsApp (app/api/cron/enviar-whatsapp). '
  'Uma linha por (aluna, tipo, dia) impede reenvio duplicado no mesmo dia.';
