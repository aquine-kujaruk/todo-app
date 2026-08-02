# Architecture Decisions

Constraints that bind future work — the things an agent would otherwise get wrong.

**Budget: ~50 lines.** One line per decision, in two groups: how the app is built, and how
work reaches production. Delete an entry once the code makes it obvious on its own, or once
a later decision supersedes it. This is a working set, not an archive — git history is the
archive. Adding is coupled to pruning: if a new entry pushes this file past its budget,
something already here has stopped earning its place.

## The application

- **The database is reachable only from the server.** The browser holds no credentials and
  talks only to same-origin `/api/*`. RLS is on with no policies and no grants, so the
  publishable key is useless by design. Anything that needs direct client access to the
  database breaks this guarantee and needs a rethink, not a workaround.
- **That guarantee is enforced by the compiler, not by discipline.** No credential gets a
  `NEXT_PUBLIC_` prefix, because Next.js inlines those into the browser bundle; and
  `lib/supabaseServer.ts` imports `server-only`, so the build fails outright if a client
  component imports it.
- **The Supabase client is created lazily,** so `npm run build` needs no environment
  variables. That is what lets CI verify the bundle without secrets.
- **Environment variables live only in Vercel**, not in the repository and not in GitHub
  secrets. Connectors can read them; writing them is a manual step for a human.
- **Schema changes ship as Supabase migrations**, never as ad-hoc SQL, so the schema has a
  history.
- **If authentication is ever added, it belongs in the `/api` layer** — already the single
  chokepoint every request passes through.
- **A browser-local preference lives in the DOM, never in React state.** The theme is
  `data-theme` on `html`, stamped by a blocking inline script in `<head>` before the first
  paint, and CSS decides what the button shows. Reading storage during render brings back
  both the flash and the hydration mismatch this shape exists to avoid.

## Getting to production

- **Production staying up outranks every other instruction.** It is health-checked before a
  merge and again after the deploy; an already-broken production stops the merge, because
  afterwards nobody could tell which change broke it. Nothing ever reverts, rolls back or
  redeploys automatically — an agent reports and waits for a human decision.
- **CI is the merge gate.** An agent's self-report that checks passed is a promise; a green
  check is a fact. `/next` merges on the check, never on an agent's judgement.
- **Deployment is Vercel's native Git integration, not an Action.** A deploy workflow
  existed and was removed: it needed a token to do what the integration does with no
  credentials at all.
- **`/next` is the default way of working, not a command.** Any request for a change runs
  the whole path — interview, issue, agents, check, merge. Only questions get answered
  directly. Nobody should have to know the skill exists.
- **Every PR closes its issue, and the issue's label is its stage.** `Closes #N` in the PR
  body is what lets a future session walk `git blame` → commit → PR → issue and recover the
  intent behind existing code. Dropping that link loses context permanently, which is why
  it is a constraint and not a convention.
- **ESLint lints, Biome formats, and they don't overlap.** Biome's linter is off. ESLint
  carries `eslint-config-next`, whose rules catch the mistakes an unsupervised model makes
  writing React. `npm run lint` is `eslint .`, never `next lint` — the latter is deprecated
  as of Next 15.5 and, unconfigured, opens an interactive prompt that hangs an agent
  forever.
- **`graphify-out/` is derived and never committed.** The graph is rebuilt on demand and is
  stale the moment code changes; committing it would bury every diff in JSON. It also never
  leaves the machine — no `--neo4j-push`, no `--falkordb-push`, no `--mcp`.
