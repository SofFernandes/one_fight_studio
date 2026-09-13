# One Fight Studio — Portal de Alunas

Portal para academia de luta: login de alunas, dados pessoais, fotos antes/atual,
consulta de mensalidade, e dashboard de admin com receita mensal e alunas ativas.

## Stack

- **Next.js 16** (App Router) + **Vercel** (hosting)
- **Supabase** (Postgres + Auth + Storage)
- **Tailwind + shadcn/ui**
- **WhatsApp Cloud API** (Meta) — aviso de mensalidade atrasada e parabéns de aniversário

## Setup local

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode nesta ordem:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_views_admin.sql`
   - `supabase/migrations/0003_grants.sql`
   - `supabase/migrations/0004_dia_vencimento.sql`
   - `supabase/migrations/0005_status_vencido_deprecated.sql`
   - `supabase/migrations/0006_grants_service_role.sql`
   - `supabase/migrations/0007_aluna_planos.sql`
   - `supabase/migrations/0008_tipo_mensagem_comment.sql`
3. Copie `.env.example` para `.env.local` e preencha com as chaves de
   **Project Settings > API** do seu projeto Supabase, e gere um `CRON_SECRET`
   com `openssl rand -hex 32`.
4. Instale dependências e rode:

```bash
npm install
npm run dev
```

5. Abra [http://localhost:3000](http://localhost:3000).

## Criando o primeiro admin

Depois de criar uma conta pela tela de login (ela nasce com papel `aluna`
por padrão), promova-a a admin rodando no SQL Editor do Supabase:

```sql
update public.profiles set papel = 'admin' where id = '<uuid-do-usuario>';
```

O UUID aparece em **Authentication > Users** no painel do Supabase.

## Estrutura

- `app/login` — tela de login
- `app/(portal)` — área da aluna (perfil, fotos, mensalidade) — protegida por `requireAluna()`
- `app/(admin)` — dashboard admin (alunas, planos) — protegida por `requireAdmin()`
- `app/actions` — Server Actions (auth, perfil, admin, planos)
- `app/api/cron/gerar-mensalidades` — cron diário que gera a mensalidade do mês de cada
  aluna no seu dia de vencimento fixo (`profiles.dia_vencimento`)
- `app/api/cron/enviar-whatsapp` — cron diário que avisa mensalidade atrasada e
  parabeniza aniversariantes via WhatsApp Cloud API
- `lib/whatsapp.ts` — encapsula a chamada à WhatsApp Cloud API (envio de template)
- `lib/supabase` — clientes Supabase (browser, server, proxy/sessão, admin/service role)
- `lib/dal.ts` — Data Access Layer: única fonte de verdade sobre quem está logado e qual o papel
- `lib/mensalidades.ts` — deriva o status exibido (pago/a vencer/vencida) a partir de
  `status` + `vencimento`; "vencida" nunca é gravado no banco, só calculado na leitura
- `lib/planos.ts` — busca planos vigentes (todos, ou os vinculados a uma aluna via
  `aluna_planos`), usado pelo cron e pelas telas de admin
- `supabase/migrations` — schema SQL (rodar manualmente no SQL Editor por enquanto)

## Mensalidade recorrente

Em **Planos e valores**, o admin cria planos com nome livre por modalidade (ex:
"Personal 2x/semana" e "Personal 3x/semana" podem coexistir). Em **Editar aluna**, o
admin marca (como chips) quais planos vigentes aquela aluna tem — pode ter mais de um
simultaneamente (ex: Grupo + Personal).

Cada aluna também tem um `dia_vencimento` (1–28). Diariamente, o cron em
`/api/cron/gerar-mensalidades` gera a mensalidade do mês corrente para toda aluna cujo
`dia_vencimento` bate com o dia de hoje, somando o valor de todos os planos vigentes
vinculados a ela numa única mensalidade (`plano_id` fica nulo quando há mais de um
plano somado). É idempotente: rodar de novo no mesmo dia não duplica nem sobrescreve
uma mensalidade já paga.

Para testar manualmente sem esperar o dia certo do mês, ajuste o `dia_vencimento` de uma
aluna de teste para o dia de hoje e rode:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/gerar-mensalidades
```

Em produção, o `vercel.json` já configura o Vercel Cron para rodar 1x/dia (06:00 UTC).

## Mensageria WhatsApp

O cron em `/api/cron/enviar-whatsapp` roda 1x/dia (12:00 UTC = 9h Brasília) e:

- Avisa toda aluna com mensalidade `pendente` e `vencimento` no passado (mesmo critério
  de "vencida" usado em `lib/mensalidades.ts`), 1x por dia enquanto continuar em aberto.
- Parabeniza quem faz aniversário no dia (compara mês/dia de `data_nascimento`).

Cada envio é idempotente via a tabela `mensagens_enviadas` — não duplica no mesmo dia
mesmo se o cron rodar mais de uma vez. Alunas sem `telefone` cadastrado são puladas.

### Configurar a WhatsApp Cloud API (Meta)

1. Crie um app em [developers.facebook.com](https://developers.facebook.com) (produto
   "WhatsApp"), verifique um número comercial e copie `WHATSAPP_PHONE_NUMBER_ID` e
   `WHATSAPP_ACCESS_TOKEN` (**API Setup** do produto WhatsApp).
2. No **WhatsApp Manager**, crie 2 templates (categoria **Utility** — evite linguagem
   promocional para facilitar a aprovação):

   **Vencimento** (ex: nome `mensalidade_atrasada`):
   > Olá {{1}}! Notamos que sua mensalidade da One Fight Studio no valor de {{2}}
   > está em aberto desde {{3}}. Para regularizar, entre em contato com a
   > administração. Qualquer dúvida, estamos à disposição! 🥊

   **Aniversário** (ex: nome `feliz_aniversario`):
   > Parabéns, {{1}}! 🎉 A equipe da One Fight Studio deseja a você um dia
   > incrível e um ano cheio de conquistas dentro e fora do tatame. 🥊🎂

3. Depois de aprovados (a Meta notifica por e-mail), preencha no `.env.local`:
   `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_TEMPLATE_VENCIMENTO`
   e `WHATSAPP_TEMPLATE_ANIVERSARIO` com os nomes exatos aprovados.

Sem essas variáveis configuradas, o cron responde 200 com aviso de "não configurado" em
vez de falhar — o restante do app funciona normalmente enquanto isso.

Para testar manualmente:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/enviar-whatsapp
```

## Próximos passos

- Filtros/busca na listagem de alunas do admin
