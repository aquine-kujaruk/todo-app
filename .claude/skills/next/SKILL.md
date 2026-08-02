---
name: next
description: Turns what a non-technical person asks for into deployed code: a thorough business interview, an issue holding the spec, and agents that implement it, pass CI and merge. Use when someone describes something they want the application to do, or something that isn't working the way they expect, without going into technical detail.
---

# Next

Someone who doesn't code says what they want; code ends up in production. They answer
questions and nothing else — no waiting, no checking, no reviewing.

```
Phase 1  Interview     you (Opus)         the product tree, all of it
Phase 2  Issue         you (Opus)         the handoff: spec + implementation
Phase 3  Delivery      Opus orchestrates, code, CI, merge
                       Sonnet implements
Phase 4  Memory        you (Opus)         what the next session shouldn't have to re-derive
```

You always move forward. **There is one stop: the nuclear.**

Everything project-specific — repository, hosting, database, commands, deployment — lives
in `CLAUDE.md`. This skill never hardcodes it.

## Before you start

Read `CLAUDE.md`, `ADR.md` and `CONTEXT.md`. They exist so you don't re-derive what was
already settled.

If the request touches something that already exists, `git blame` the relevant lines, find
the commit, and read the issue it closed. That issue holds the **intent** behind the code —
what the client was trying to achieve, and what was deliberately left out. Code tells you
what it does; the issue tells you why.

## Phase 1 — Their what, your how

You are the domain analyst; the person talking to you is the client. They know what they
want and why, not how it gets built. Interview them in their own language, whichever they
write to you in.

**The filter**, before writing any question:

> Would someone who only ever uses this application, and has never seen the code, have an
> opinion about this?

Yes → ask it. No → decide it silently and record it in the issue. Table names, endpoint
shapes, indexes, optimistic UI, validation, where state lives: all on the "no" side.

Facts get looked up, not asked: the repository, the running service, previous issues.

### The tree

**The filter picks which tree you walk, not how far.** You walk the product tree whole,
branch by branch, resolving dependencies between decisions one at a time. Every answer
opens new branches — follow them to the end.

Interrogate the places where people assume without noticing: what happens when it's empty,
when it fails, when it already exists, when it's done twice, when two people do it at once,
who should see it and who shouldn't, what they expect to see immediately afterwards. The
client knows all of it; they just didn't know it needed saying.

**You're done when no open branch is left** and no pending question would change what gets
built. Many product questions is a good sign. Many technical ones means they're sneaking
through the filter in disguise — run them past it again.

**How to ask:** one at a time, two sentences at most, with your recommendation inside so
that "sure" is a complete answer. In the language of someone using the app, never of
someone building it. The interview is long; each question is short.

| ❌ | ✅ |
| --- | --- |
| Soft delete or hard delete? | When you delete one, do you want to get it back later, or is it gone for good? I'd make it gone. Sound right? |
| Should that timestamp be a date or a datetime? | Does the time of day matter here, or is the day enough? I'd keep it to the day — simpler to fill in. Sound right? |
| Do we need an index on that column? | *(you decide)* |

### The nuclear

Irreversible or expensive to undo: deleting or transforming existing data, personal data,
accounts and passwords, money, opening the database to the browser, sending data to an
outside service.

There you stop and warn, before it goes into the plan:

> ⚠️ **This is worth running past someone technical before we build it.**
> <What's delicate and what could go wrong, no jargon.>
> Say the word and I'll carry on.

If they say go, go — it's their call. The warning goes into the issue either way.

### Closing

State what's going to be built, as a statement rather than a question, and move to Phase 2.
Approval was invoking this skill.

## Phase 2 — The issue

One issue on the project's tracker, labelled `ready-for-agent`. It's the **handoff**: nobody
downstream reads this conversation, so what isn't written there doesn't exist.

Title in plain language — "let people set a due date on tasks", not "add a due_date column".

<issue-template>

## What was asked

In their words.

## What we agreed

Everything the interview settled, in plain language, one decision per line. Include the
assumptions you made without asking, marked as such, and any ⚠️ warning and how it resolved.

## User stories

A long numbered list — "As a <actor>, I want <capability>, so that <benefit>" — covering the
edge cases you closed in the interview: empty, failure, missing, done twice, two people at
once.

## Implementation decisions

For whoever writes the code: modules touched, API contracts, schema changes, specific
interactions. No file paths — they go stale. A schema or a type, yes, when it carries the
decision better than prose.

Every constraint from `ADR.md` that this work touches, restated so the implementer doesn't
have to guess which ones apply.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Plan

Numbered slices in dependency order. Each is a **tracer bullet**: it cuts through every
layer and can be demoed on its own. "Database first, then the API" is the wrong shape. One
slice is normal.

1. **<Title>** — what works end to end once it lands. Blocked by: nothing.

## Out of scope

What deliberately isn't being done, and why.

</issue-template>

## Phase 3 — Delivery

Dispatch **one Opus subagent** that orchestrates the rest: `subagent_type: general-purpose`,
`model: opus`, `run_in_background: false`. It starts **cold**, with the issue reference and
nothing else — which is why Phase 2 has to stand alone.

Opus orchestrates because it hands out work and judges results with nobody reviewing it;
Sonnet implements each slice, which is bounded work that's already specified.

<orchestrator-prompt>

Deliver issue #<number> of <repository>, end to end.

Read it, then read `CLAUDE.md` and `ADR.md`. The issue is your only source — there is no
prior conversation to consult.

You do not write code. You hand out work, wait, judge, and hand out again to fix.

1. Work on `feature/<slug>` off the default branch. Every slice lands there.
2. For each slice in dependency order, dispatch a subagent with
   `subagent_type: general-purpose` and `model: sonnet`, giving it the issue number, its
   slice, and what earlier slices already landed. One at a time; two at once only if they
   don't block each other and touch different files, with `isolation: "worktree"`.
3. When all slices are in, open the PR with `Closes #<number>`.
4. **Wait for the CI check.** Poll until it concludes. Don't merge on your own judgement
   and don't treat an unfinished check as a pass.
5. If it's red, read the failing job's logs, dispatch a Sonnet with that diagnosis, and go
   back to step 4. If the same failure survives two attempts, stop and report.
6. Green: merge.
7. Verify the deployment the way `CLAUDE.md` describes.

Report: what the app can do now that it couldn't, the check's final state, and any
acceptance criterion left uncovered.

</orchestrator-prompt>

### The gate is the check, not the model

Formatting, linting and build run in CI against the branch. An agent saying "lint passed"
is a promise; **green** is the check, which is a fact and doesn't depend on anyone
remembering to look. Agents may run those commands while working, but what opens the merge
is the check.

## Phase 4 — Memory

Once it's merged, update `ADR.md` and `CONTEXT.md` so the next session doesn't start from
zero. Add a decision only if it will **bind future work** — a constraint someone would
otherwise get wrong. Rejected alternatives, one-off details and anything the code now makes
obvious don't belong there.

Both files carry a line budget. **Adding is coupled to pruning**: if your entry pushes a
file past its budget, something already in it has stopped earning its place — delete that
instead of growing the file. Git history is the archive; these two are a working set.

Then notify the client — by this point the whole aim is that they've gone and done
something else — and tell them in two or three plain sentences what the app can do now that
it couldn't, with a link to the issue. Nobody else sees the orchestrator's report.
