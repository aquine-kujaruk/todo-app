# Domain Context

What the product means, so a session doesn't have to infer it from the code.

**Budget: ~30 lines.** One line per fact. A fact belongs here only if the code doesn't
already say it plainly, or if it's a deliberate absence someone would otherwise "fix" by
mistake. Same pruning rule as `ADR.md`: adding is coupled to removing.

## What this is

- **One shared list.** There are no accounts and no sign-in: anyone who opens the site
  edits the same todos as everyone else, because the API doesn't distinguish who is
  calling. This is the current state of a proof of concept, not a finished intent.
- **A todo is a title and a done flag.** The title is trimmed and must be between 1 and 500
  characters; empty or whitespace-only is rejected.
- **Deleting is permanent.** No trash, no undo, no recovery.
- **Light or dark is per browser.** Until someone presses the toggle their device decides;
  from then on their choice wins and is remembered only there. The list is shared, the
  theme is not.

## Deliberately absent

These were not forgotten. Adding any of them is a product decision for the client, not a
gap to be filled in passing.

- Due dates, priorities, categories, tags.
- Assigning a todo to a person; any notion of ownership.
- Editing a todo's title after it's created — only the done flag changes.
- Searching, filtering, or paginating the list.
- A third "follow my device again" state on the theme toggle: it is two states, not three.
