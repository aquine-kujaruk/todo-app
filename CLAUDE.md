# CLAUDE.md

Context for working on this repository from Claude Code. The app is maintained from
here: changes are asked for in chat, opened as a PR and merged to `main`, which is
what triggers deployment.

Everything project-specific lives in this file. `/next` reads it rather than
hardcoding any of it, so the skill stays portable across repositories.

## Where memory lives

| File | Holds | Read it |
| --- | --- | --- |
| `ADR.md` | Architectural constraints that bind future work | Before changing anything structural |
| `CONTEXT.md` | What the product means, and what is deliberately absent | Before adding a feature |
| Closed issues | The intent behind existing code | `git blame` a line → its commit → its issue |

Both files carry a line budget and are pruned as they grow: adding a decision is
coupled to removing one that has stopped earning its place. Git history is the
archive.

## Asking for changes without knowing how to code

`/next` (in `.claude/skills/`) covers that whole path for a non-technical person: a
plain-language interview — thorough, but only about what that person can decide,
never about the technical side — then an issue holding the spec and the plan, handed
to an Opus agent that orchestrates Sonnets to implement it, waits for the CI check
and merges to `main` on green. Whoever asked waits for nothing and checks nothing:
they get a notification once it's in production.

## The three places this lives

| | Identifier | How to reach it |
| --- | --- | --- |
| **GitHub** | `aquine-kujaruk/todo-app`, default branch `main` | `mcp__github__*` tools |
| **Supabase** | project `todo-poc`, ref **`itnmhhhqymgsegnntemk`**, region `eu-west-1`, org `crjyxjevreumhokuxvig` | `mcp__Supabase__*` tools, passing that `project_id` |
| **Vercel** | project `todo-poc`, id **`prj_rtkLNg3dwtHa5lfCfNd4jXwAdC1q`**, team **`team_3DUaoBXJoYRInk75ggr2PtDx`** (slug `edgar-aquines-projects`) | `mcp__Vercel__*` tools, passing `teamId` |

- Production: **https://todo-poc.vercel.app**
- Supabase API: `https://itnmhhhqymgsegnntemk.supabase.co`

Two other projects share the same Supabase organization (`Doc Search`,
`Poc-prisa-backoffice`) and have nothing to do with this one. Always confirm the ref
before applying a migration.

## Architecture

```
Browser ──fetch /api/todos──► Vercel Lambda ──service_role──► Supabase
(no keys)                     (Next.js)                       (RLS closed)
```

- `components/TodoApp.tsx` — the client. Only `fetch` to same origin. It doesn't
  import the Supabase SDK and knows no keys.
- `app/api/todos/route.ts`, `app/api/todos/[id]/route.ts` — the backend.
- `lib/supabaseServer.ts` — the only place credentials are read.

The `todos` table has RLS on, **no policies**, and no grants to `anon` or
`authenticated`. The publishable key grants nothing:

```console
$ curl "https://itnmhhhqymgsegnntemk.supabase.co/rest/v1/todos?select=*" \
    -H "apikey: sb_publishable_EmD-j7cm9koq_TSI97uRPg_DdzrrbY2"
{"code":"42501","message":"permission denied for table todos"}
```

That is the design, not a bug. `ADR.md` has the constraints this implies.

## Deployment

Handled by **Vercel's native Git integration**, connected in the dashboard. There is
no `VERCEL_TOKEN` and no secret in the repository.

| Event | Result |
| --- | --- |
| PR against `main` | preview deploy + CI check |
| Merge to `main` | production deploy |

A workflow once deployed via the Vercel CLI; it was removed because it needed a token
to achieve what the native integration gives with no credentials. It's still in
history (`git log -- .github/workflows/deploy.yml`).

So no Action touches deployment. The only one is `.github/workflows/ci.yml`, running
`format`, `lint` and `build` on every PR and every push to `main`. It exists because
it is `/next`'s gate: an agent saying "lint passed" is a promise, a green check is a
fact. It needs no secrets — `npm run build` works without environment variables.

## Environment variables

They live **only in Vercel**: project `todo-poc` → Settings → Environment Variables.
Not in the repository, not in GitHub secrets.

| Variable | Source |
| --- | --- |
| `SUPABASE_URL` | `https://itnmhhhqymgsegnntemk.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` |

## What the connectors can't do

Things to ask the user for, because no tool covers them:

- **Writing environment variables in Vercel.** They can be read, not written.
- **Creating GitHub secrets.**
- **Reading the Supabase `service_role` key.** The connector only exposes publishable
  keys. If it's needed, the user copies it from the dashboard.
- **Connecting the repository to a Vercel project.**

The Vercel connector expires periodically and has to be reauthorized from the
claude.ai connector settings. If its tools fail on authorization, say so rather than
declaring deployment unreachable: `curl` to `https://todo-poc.vercel.app/api/health`
still works for checking state.

## Checking it's all still standing

```bash
# The backend reaches the database
curl -s https://todo-poc.vercel.app/api/health          # {"ok":true,"todos":N}

# The database is still closed from outside
curl -s "https://itnmhhhqymgsegnntemk.supabase.co/rest/v1/todos?select=*" \
  -H "apikey: sb_publishable_EmD-j7cm9koq_TSI97uRPg_DdzrrbY2"   # 42501
```

`/api/health` distinguishes "environment variables missing"
(`reason: not_configured`) from "the database isn't answering"
(`reason: database_unreachable`).

## Local development

```bash
npm install
cp .env.example .env.local   # and paste the service_role key
npm run dev
```

| Command | What it is | Why |
| --- | --- | --- |
| `npm run format` | `biome format .` — fails on unformatted files | Fast; `format:write` fixes in place |
| `npm run lint` | `eslint .` with `eslint-config-next` | Catches the Next.js and hooks mistakes a model makes unsupervised |
| `npm run build` | `next build` | Works without env vars, which is what proves no credential reached the client bundle |

Those three are what CI runs, and the green check is what opens the merge. Biome
formats and ESLint lints; they don't overlap, and Biome's linter is off on purpose.

## Schema

```sql
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 500),
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);
```

Schema changes with `mcp__Supabase__apply_migration` on
`project_id: itnmhhhqymgsegnntemk`, not `execute_sql`, so they're recorded as
migrations.
