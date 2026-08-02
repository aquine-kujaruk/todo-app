# Todo POC — Next.js + Supabase + Vercel

Proof of concept: a simple todo list, no user authentication, where **the browser
never talks to Supabase**. The whole database sits behind the app's own server
routes.

## Architecture

```
Browser  ──fetch /api/todos──►  Vercel Lambda  ──service_role key──►  Supabase
(holds no keys)                 (Next.js Route Handler)               (RLS closed)
```

- `components/TodoApp.tsx` — the client. Only `fetch` to same origin. It doesn't
  import the Supabase SDK and knows no keys.
- `app/api/todos/route.ts` and `app/api/todos/[id]/route.ts` — the backend. They
  validate input and talk to Supabase.
- `lib/supabaseServer.ts` — imports `server-only`, so **the build fails** if anyone
  tries to use it from a client component.

No variable carries a `NEXT_PUBLIC_` prefix, so Next doesn't inline them into the
bundle: they exist only in the server process.

## Why the database is genuinely closed

The `todos` table has RLS on and **no policies**, and permissions for the `anon` and
`authenticated` roles have been revoked. That makes the public key useless:

```console
$ curl "$SUPABASE_URL/rest/v1/todos?select=*" -H "apikey: <public key>"
{"code":"42501","message":"permission denied for table todos"}
```

The `service_role` key bypasses RLS and lives only on the server. The only route to
the data is through `/api`.

## Where the keys go

**In Vercel**, not in the repository and not in GitHub: Project `todo-poc` → Settings
→ Environment Variables.

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://itnmhhhqymgsegnntemk.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` |

Nothing needs configuring on GitHub: no secrets, no tokens.

## Deployment

Handled by Vercel's native Git integration. Connected once in Project `todo-poc` →
Settings → Git → Connect Git Repository, and from then on Vercel watches the
repository on its own:

| Event | Result |
| --- | --- |
| PR against `main` | preview deploy + a comment with the URL on the PR |
| Merge to `main` | production deploy |

No GitHub Action deploys. One used to, via the Vercel CLI, but it required a
`VERCEL_TOKEN` in the repository secrets to achieve what the native integration gives
with no credentials at all. It's in history
(`git log -- .github/workflows/deploy.yml`).

## Continuous integration

`.github/workflows/ci.yml` runs `format`, `lint` and `build` on every PR and every
push to `main`. It needs no secrets, since `npm run build` works without environment
variables — which is exactly what proves no credential reached the client bundle.

| Command | What it is |
| --- | --- |
| `npm run format` | `biome format .` — `format:write` fixes in place |
| `npm run lint` | `eslint .` with `eslint-config-next` |
| `npm run build` | `next build` |

## API

| Method | Path | Body |
| --- | --- | --- |
| `GET` | `/api/todos` | — |
| `POST` | `/api/todos` | `{ "title": "…" }` |
| `PATCH` | `/api/todos/:id` | `{ "is_done": true }` |
| `DELETE` | `/api/todos/:id` | — |
| `GET` | `/api/health` | — |

## Schema

```sql
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 500),
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);
```

## Local development

```bash
npm install
cp .env.example .env.local   # and paste the service_role key
npm run dev
```

## What this POC still doesn't solve

There is no user authentication: anyone who opens the site can change the list,
because the API doesn't distinguish who is calling. What changed from the earlier
version is that access now goes through your server, which is where login,
permissions or rate limiting would go. The database is no longer exposed.
