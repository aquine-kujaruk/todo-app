# Architecture Decisions

Constraints that bind future work — the things an agent would otherwise get wrong.

**Budget: ~40 lines.** One line per decision. Delete an entry once the code makes it
obvious on its own, or once a later decision supersedes it. This is a working set, not an
archive — git history is the archive. Adding is coupled to pruning: if a new entry pushes
this file past its budget, something already here has stopped earning its place.

- **The database is reachable only from the server.** The browser holds no credentials and
  talks only to same-origin `/api/*`. RLS is on with no policies and no grants, so the
  publishable key is useless by design. Anything that needs direct client access to the
  database breaks this guarantee and needs a rethink, not a workaround.
- **No credential gets a `NEXT_PUBLIC_` prefix.** Next.js inlines those into the browser
  bundle. This is why the rule exists rather than being a style preference.
- **`lib/supabaseServer.ts` imports `server-only`,** so the build fails if a client
  component imports it. The guarantee above is enforced by the compiler, not by discipline.
- **The Supabase client is created lazily,** so `npm run build` needs no environment
  variables. That is what lets CI verify the bundle without secrets.
- **Environment variables live only in Vercel**, not in the repository and not in GitHub
  secrets. Connectors can read them; writing them is a manual step for a human.
- **Deployment is Vercel's native Git integration, not an Action.** A deploy workflow
  existed and was removed: it needed a token to do what the integration does with no
  credentials at all.
- **CI is the merge gate.** An agent's self-report that checks passed is a promise; a green
  check is a fact. `/next` merges on the check, never on an agent's judgement.
- **ESLint lints, Biome formats, and they don't overlap.** Biome's linter is off. ESLint
  carries `eslint-config-next`, whose Next.js rules catch the mistakes an unsupervised
  model makes writing React; Biome is there for speed on formatting only.
- **`npm run lint` is `eslint .`, not `next lint`.** The latter is deprecated as of Next
  15.5 and, unconfigured, opens an interactive prompt that hangs an agent forever.
- **Schema changes ship as Supabase migrations**, never as ad-hoc SQL, so the schema has a
  history.
- **If authentication is ever added, it belongs in the `/api` layer.** That layer is
  already the single chokepoint every request passes through.
