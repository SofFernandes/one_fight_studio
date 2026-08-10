# One Fight Studio — Portal de Alunas

Portal para academia de luta: login de alunas, dados pessoais, fotos antes/atual,
consulta de mensalidade, e dashboard de admin com receita mensal e alunas ativas.

## Stack

- **Next.js 16** (App Router) + **Vercel** (hosting)
- **Supabase** (Postgres + Auth + Storage)
- **Tailwind + shadcn/ui**
- WhatsApp Cloud API (fase 2 — mensageria de vencimento/aniversário)

## Setup local

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, rode nesta ordem:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_views_admin.sql`
   - `supabase/migrations/0003_grants.sql`
   - `supabase/migrations/0004_dia_vencimento.sql`
   - `supabase/migrations/0005_status_vencido_deprecated.sql`
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
- `lib/supabase` — clientes Supabase (browser, server, proxy/sessão, admin/service role)
- `lib/dal.ts` — Data Access Layer: única fonte de verdade sobre quem está logado e qual o papel
- `lib/mensalidades.ts` — deriva o status exibido (pago/a vencer/vencida) a partir de
  `status` + `vencimento`; "vencida" nunca é gravado no banco, só calculado na leitura
- `lib/planos.ts` — busca o plano vigente de uma modalidade (usado pelo cron)
- `supabase/migrations` — schema SQL (rodar manualmente no SQL Editor por enquanto)

## Mensalidade recorrente

Cada aluna tem um `dia_vencimento` (1–28) definido em **Editar aluna**. Diariamente, o
cron em `/api/cron/gerar-mensalidades` gera a mensalidade do mês corrente para toda
aluna cujo `dia_vencimento` bate com o dia de hoje, usando o valor do plano vigente da
sua modalidade. É idempotente: rodar de novo no mesmo dia não duplica nem sobrescreve
uma mensalidade já paga.

Para testar manualmente sem esperar o dia certo do mês, ajuste o `dia_vencimento` de uma
aluna de teste para o dia de hoje e rode:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/gerar-mensalidades
```

Em produção, o `vercel.json` já configura o Vercel Cron para rodar 1x/dia (06:00 UTC).

## Próximos passos (fase 2)

- Cron de WhatsApp: avisar mensalidade vencida e parabenizar aniversário via WhatsApp Cloud API
- Filtros/busca na listagem de alunas do admin
