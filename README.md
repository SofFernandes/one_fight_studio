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
3. Copie `.env.example` para `.env.local` e preencha com as chaves de
   **Project Settings > API** do seu projeto Supabase.
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
- `lib/supabase` — clientes Supabase (browser, server, proxy/sessão)
- `lib/dal.ts` — Data Access Layer: única fonte de verdade sobre quem está logado e qual o papel
- `supabase/migrations` — schema SQL (rodar manualmente no SQL Editor por enquanto)

## Próximos passos (fase 2)

- Cron diário (Vercel Cron) para: avisar mensalidade vencida e parabenizar aniversário via WhatsApp Cloud API
- Geração automática de `mensalidades` todo início de mês a partir do `plano` vigente da aluna
- Filtros/busca na listagem de alunas do admin
