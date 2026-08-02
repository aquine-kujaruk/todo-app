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

## The knowledge graph

`graphify` turns the repository into a queryable graph of what connects to what. Use
it to answer "what does this touch?" before planning a change, instead of grepping
blind. `.claude/skills/graphify/` holds the bootstrap: install, version check, build,
query.

The container is ephemeral, so the tool is absent at the start of every session.
Whenever a `/next` run reaches the point of writing an issue, dispatch **one Sonnet
subagent in the background** to install-or-upgrade it and refresh the graph, then keep
interviewing while it works — nobody waits on the graph.

**It is not local by default.** `graphify extract`, `cluster-only` and `label`
auto-detect a model backend, and with no API key set they shell out to the `claude`
CLI on `PATH` — a nested agent, real cost, and the repository leaving the machine. The
build is always `graphify extract . --code-only` then
`graphify cluster-only . --no-label`, and refreshes are `graphify update .`, which
never calls a model. `GRAPH_REPORT.md` prints `Token cost: 0 input · 0 output` when
the run really was local.

`graphify-out/` is gitignored on purpose: it's derived, it goes stale the moment code
changes, and its JSON would bury every diff. It's excluded in `biome.json` too, since
Biome formats `**` and doesn't read `.gitignore`. Never push the graph to an outside
store and never serve it over `graphify-mcp`.

## Mandate zero: production stays up

Above everything else in this file. Before merging anything, and again after the
deploy, run the health check below. If production is unhealthy — **either time** —
stop, tell the user what's failing, and wait for their decision. Never merge onto a
production that is already down: nobody could then tell which change broke it.

**Never revert, roll back or redeploy on your own judgement.** Report and wait. A
feature that ships tomorrow costs nothing; an outage costs the user their app.

## How changes get asked for

`/next` (in `.claude/skills/`) is **the default way of working here, not a command
anyone has to type**. Any message asking the app to do something new, or reporting
that it behaves wrong, runs the whole path: a plain-language interview — thorough,
but only about what the person can decide — then an issue holding the spec and the
plan, handed to an Opus agent that orchestrates Sonnets, waits for the CI check and
merges to `main` on green. Whoever asked waits for nothing and checks nothing.

A question ("is it up?", "why is it built like this?") is just answered — no
interview, no issue. When it's genuinely unclear which one it is, run the flow.

If someone opens by saying they're technical, talk to them technically: architecture,
schema and trade-offs in their vocabulary, and ask what you'd otherwise decide alone.
Nothing else relaxes — issue, green check and mandate zero all still apply.

### Issues carry the stage, and the link back

An issue's label is where it is right now, and exactly one applies at a time:
`ready-for-agent` → `implementing` → `in-review` → `deploying` → `shipped`. `blocked`
is added alongside whichever stage stalled, and removed when it moves again.

Every PR body says `Closes #` and the literal issue number. That link is the memory of
this project: to find out why existing code is the way it is, `git blame` it, take the
`(#N)` from the commit subject to the PR, and the `Closes` in the PR to the issue that
explains the intent. An issue still on `ready-for-agent` after its code shipped, or
still open after it merged, is a bug — verify and close it by hand, since `Closes`
doesn't always fire.

Two traps, both hit in practice: GitHub strips anything shaped like an HTML tag, so a
placeholder in angle brackets posts as nothing and `Closes #` links to no issue —
write real digits and wrap placeholders in backticks.

Setting labels replaces the whole set, which is what keeps the stages exclusive: pass
`["in-review"]` to move, `["in-review", "blocked"]` to stall. A label that doesn't
exist yet is created the first time it's applied — no need to make it by hand.

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

Things to ask the user for, because no tool covers them. Never report these as
impossible and never quietly skip them: stop and hand over a procedure — where to
click, what to paste, how they'll know it worked, and what you'll do once they
confirm. Then wait. One blocked step is not a failed request.

- **Writing environment variables in Vercel.** They can be read, not written.
- **Creating GitHub secrets.**
- **Reading the Supabase `service_role` key.** The connector only exposes publishable
  keys. If it's needed, the user copies it from the dashboard.
- **Connecting the repository to a Vercel project.**
- **Installing `graphify` unattended.** `uv tool install graphifyy` can trip the
  sandbox permission classifier even with the allow rule in `.claude/settings.json`;
  if it does, the user approves it once when prompted.

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
