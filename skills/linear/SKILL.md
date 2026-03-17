---
name: linear
description: Manage Linear issues. Use when searching, creating, updating, or closing Linear issues, or querying team/project info. Trigger for any Linear operation including checking issue status, breaking tasks into Linear issues, adding comments, querying workflow states, etc. Supports arbitrary GraphQL queries.
---

# Linear

Direct Linear GraphQL API access via Bun CLI. Zero external dependencies.

Two script variants:

| Script | Size | Use Case |
|--------|------|----------|
| `scripts/linear.ts` | ~120 lines | Standard: `setup` + `api`, agent constructs queries using api.md |
| `scripts/linear-issue.ts` | ~570 lines | Issue-specific: wraps search/create/update/list/comment as named commands |

## Setup

Check if `config.json` exists in this directory:

- **Exists** → use directly
- **Missing** → ensure `LINEAR_API_KEY` env var is set (Linear Settings → API → Personal API Keys), then run:

```bash
bun <skill-dir>/scripts/linear.ts setup
# or (full version)
bun <skill-dir>/scripts/linear-issue.ts setup
```

Config structure:
```json
{ "apiKey": "$LINEAR_API_KEY", "teamKey": "YOUR_TEAM_KEY" }
```
- `apiKey`: API key or env var reference (`$LINEAR_API_KEY`)
- `teamKey`: Linear team key (e.g. `WOR`)

## Issue Commands (linear-issue.ts)

| Command | Purpose |
|---|---|
| `setup` | Interactive config.json initialization |
| `search <query>` | Search issues by keyword |
| `list [--state <name>] [--project <slug>]` | List issues |
| `create --title "..." [--body "..." \| --body-file path] [--template feat]` | Create issue |
| `update <id> [--parent <id>] [--state <name>]` | Update issue |
| `comment <id> [--body "..." \| --body-file path]` | Add comment |
| `teams` / `templates` / `states` | Query workspace metadata |
| `api '<graphql>' [--vars '<json>']` | Arbitrary GraphQL query |

## Standard Commands (linear.ts)

| Command | Purpose |
|---|---|
| `setup` | Initialize config.json |
| `api '<graphql>' [--vars '<json>']` | Arbitrary GraphQL query |

Use `--body-file` for multi-line body (write to temp file) to avoid shell escaping issues.

See [references/api.md](references/api.md) for query examples and detailed usage.
