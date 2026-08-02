---
name: graphify
description: The knowledge graph of this repository — what connects to what, across code, docs and schema. Use before planning any change, to answer "what does this touch?" without grepping blind, and for any question about architecture, file relationships or where a concept lives. Also covers installing and updating the graphify tool itself, which is absent at the start of every session because the container is ephemeral.
---

# Graphify

`graphify` (upstream: [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify),
PyPI `graphifyy`) parses the repository with tree-sitter and produces a queryable graph.
It's local AST work — no model calls, no API cost, nothing leaves the machine.

Edges are labelled for honesty: `EXTRACTED` was found in the source, `INFERRED` was
resolved. Treat an `INFERRED` edge as a lead, not a fact.

## Bootstrap

The container is ephemeral: assume the tool is **not** installed. Getting it ready is one
Sonnet subagent's job, dispatched in the background so nobody waits on it.

```bash
graphify --version                      # installed?
uv tool install graphifyy               # no → install
uv tool upgrade graphifyy               # yes → keep it current
```

"Outdated" means the installed version differs from the latest on PyPI:

```bash
curl -s https://pypi.org/pypi/graphifyy/json | python3 -c "import sys,json; print(json.load(sys.stdin)['info']['version'])"
```

If `uv tool install` is refused by the sandbox permission classifier, fall back to a
virtualenv in the scratchpad (`uv venv` + `uv pip install graphifyy`) and call the binary
by absolute path. If that fails too, say so plainly and carry on with `git` and `grep` — a
missing graph slows the work down, it never blocks it.

**Do not run `graphify install`.** That subcommand rewrites `CLAUDE.md` and overwrites this
file with the vendor's own. This repository owns its skill and its `CLAUDE.md`.

## Build

```bash
graphify .                # full pipeline into graphify-out/
graphify . --update       # incremental: only new or changed files
graphify . --no-viz       # skip the HTML if generation fails
```

Three outputs land in `graphify-out/`: `graph.json` (queryable), `GRAPH_REPORT.md`
(prose), `graph.html` (interactive).

`graphify-out/` is **gitignored and never committed** — derived, stale the moment code
changes, and its JSON would bury every diff.

**Never** pass a flag that sends the graph anywhere: `--neo4j-push`, `--falkordb-push`,
`--mcp`. The graph describes a codebase whose whole architecture is that credentials stay
server-side; it stays local.

## Query

Once `graphify-out/graph.json` exists, reach for these before grep — they return a scoped
subgraph rather than a wall of matches:

| Command | For |
| --- | --- |
| `graphify query "<question>"` | "What connects the API to the database?" |
| `graphify path "<A>" "<B>"` | The shortest link between two things |
| `graphify explain "<concept>"` | Everything hanging off one component |

Read `graphify-out/GRAPH_REPORT.md` only for a broad architecture sweep, or when the three
above don't surface enough.

After code lands, `graphify . --update` keeps it current. It's cheap; there's no reason to
work against a stale graph.
