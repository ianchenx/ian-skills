---
name: handoff
description: Write HANDOFF.md before ending a complex session. Use when wrapping up, switching tasks, or when context is getting large and a fresh session would help.
---

# Session Handoff

Write a `HANDOFF.md` in the project root so the next session can continue
without losing context. This file is overwritten each time — history is
preserved by git.

## When to Write

- Before ending a session with significant progress
- When context is large and a fresh session would be more effective
- When the user says "handoff", "wrap up", "save progress", or similar

## Template

Write `HANDOFF.md` in the project root with this structure:

```markdown
# Handoff

## Current State
What's done and what's not. Be specific — file names, function names, line numbers.

## What Worked
Approaches and decisions that succeeded. Include rationale.

## What Failed
Dead ends and why they failed. Save the next session from repeating mistakes.

## Open Issues
Bugs, edge cases, or concerns discovered but not yet addressed.

## Next Steps
Exactly what the next session should do first.
Ordered by priority. Be actionable, not vague.
```

## Rules

1. Be **specific** — "Modified `src/auth.ts` lines 45-80 to add JWT validation"
   not "Updated auth code"
2. Be **honest** about failures — the next session needs to know what NOT to try
3. Keep it **under 200 lines** — this will be loaded into the next session's context
4. **Overwrite** the existing HANDOFF.md — don't append
5. After writing, tell the user: "HANDOFF.md written. Start next session with:
   read HANDOFF.md and continue"

## Resuming from Handoff

When the user says "read HANDOFF.md" or "continue from handoff":
1. Read `HANDOFF.md` from the project root
2. Summarize the current state to the user
3. Confirm the next steps before proceeding
