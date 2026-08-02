# Architecture Decisions

Constraints that bind future work — the things an agent would otherwise get wrong.

**Budget: ~50 lines.** One decision per entry, in two groups: how the app is built, and how
work reaches production. Delete an entry once the code makes it obvious, or once a later
one supersedes it — git history is the archive. Adding is coupled to pruning.

## The application

- **The database is reachable only from the server.** The browser holds no credentials and
  talks only to same-origin `/api/*`. RLS is on with no policies and no grants, so the
  publishable key is useless by design. Anything needing direct client access to the
  database breaks this guarantee and needs a rethink, not a workaround.
- **That guarantee is enforced by the compiler, not by discipline.** No credential gets a
  `NEXT_PUBLIC_` prefix, which Next.js would inline into the browser bundle; and
  `lib/supabaseServer.ts` imports `server-only`, so the build fails if a client component
  imports it.
- **The Supabase client is created lazily,** so `npm run build` needs no environment
  variables — which is what lets CI verify the bundle without secrets.
- **Environment variables live only in Vercel**, not in the repository, not in GitHub
  secrets. Connectors read them; writing them is a manual step for a human.
- **Schema changes ship as Supabase migrations**, never ad-hoc SQL, so the schema has a
  history.
- **If authentication is ever added, it belongs in the `/api` layer** — already the single
  chokepoint every request passes through.
- **A browser-local preference lives in the DOM, never in React state.** The theme is
  `data-theme` on `html`, stamped by a blocking inline script before first paint, and CSS
  decides what the button shows. Reading storage during render brings back the flash and
  the hydration mismatch this shape avoids.

## Getting to production

- **Production staying up outranks every other instruction.** Health-checked before a merge
  and again after the deploy; an already-broken production stops the merge, since afterwards
  nobody could tell which change broke it. Nothing reverts or redeploys automatically — an
  agent reports and waits for a human.
- **CI is the merge gate.** An agent's self-report is a promise; a green check is a fact.
  `/next` merges on the check, never on an agent's judgement.
- **Deployment is Vercel's native Git integration, not an Action.** A deploy workflow existed
  and was removed: it needed a token to do what the integration does with no credentials.
- **`/next` is the default way of working, not a command.** Any request for a change runs the
  whole path; only questions get answered directly. Nobody should need to know it exists.
- **Every PR closes its issue, and the issue's label is its stage.** A literal `Closes #N` is
  what lets a future session walk `git blame` → commit → PR → issue and recover the intent
  behind existing code. Placeholders in angle brackets are stripped by the tracker and link
  nothing; auto-close doesn't always fire, so the issue is verified closed by hand.
- **ESLint lints, Biome formats, and they don't overlap.** Biome's linter is off; ESLint
  carries `eslint-config-next`. `npm run lint` is `eslint .`, never `next lint` — deprecated
  as of Next 15.5 and, unconfigured, it opens a prompt that hangs an agent forever.
- **The knowledge graph is local-only and never committed.** `graphify` auto-detects a model
  backend and falls back to the `claude` CLI on `PATH`, so a bare `extract` quietly becomes a
  nested agent shipping the repository off the machine: build with `extract --code-only` and
  `cluster-only --no-label`. `graphify-out/` is derived and stale on the next commit, so it
  stays out of git and out of Biome's reach.
