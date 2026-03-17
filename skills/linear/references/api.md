# Linear CLI Command Reference

All commands invoked via `bun <skill-dir>/scripts/linear-issue.ts <command>` (or `linear.ts` for `setup` and `api` only).

## setup

Interactive config.json initialization. Queries teams, templates, and workflow states with auto-mapping.

```bash
bun <skill-dir>/scripts/linear-issue.ts setup
```

Prerequisite: `LINEAR_API_KEY` env var must be set.

Example output:
```
🔍 Fetching teams...
Available Teams:
  1. Swarm Workers (WOR) — abc123

✅ Using team: WOR

🔍 Fetching templates...
Available Templates:
  - Design: tpl_design_id
  - Feature: tpl_feat_id

🔍 Fetching workflow states...
Available States:
  - Backlog (backlog): state_1
  - Todo (unstarted): state_2
  - In Progress (started): state_3
  - Done (completed): state_4
  - Canceled (canceled): state_5

✅ config.json written
```

## search

Search issues by keyword (fuzzy title match or exact identifier match).

```bash
bun <skill-dir>/scripts/linear-issue.ts search "webhook"
bun <skill-dir>/scripts/linear-issue.ts search "WOR-42"
```

Output format: `identifier  state  priority  title`

## list

List issues. Default behavior depends on config:
- Has `defaultProject` → only list that project
- No `defaultProject` → list all team issues

Optional filters:
```bash
bun <skill-dir>/scripts/linear-issue.ts list
bun <skill-dir>/scripts/linear-issue.ts list --state "Todo"
bun <skill-dir>/scripts/linear-issue.ts list --project "my-project"
bun <skill-dir>/scripts/linear-issue.ts list --state "In Progress" --project "swarm"
```

## create

Create an issue. `--title` is required, `--body` / `--body-file` optional, `--template` references template ID from config.

```bash
# Simple create
bun <skill-dir>/scripts/linear-issue.ts create --title "feat(webhook): add retry support"

# With template and body file (recommended for multi-line content)
cat > /tmp/issue-body.md << 'EOF'
## Scope
- Implement exponential backoff retry
- Max 3 retries

## Verification
- Simulate webhook failure, confirm retry behavior
EOF

bun <skill-dir>/scripts/linear-issue.ts create \
  --title "feat(webhook): add retry support" \
  --body-file /tmp/issue-body.md \
  --template feat
```

Example output:
```
✅ WOR-43: feat(webhook): add retry support
   https://linear.app/team/issue/WOR-43
   id: uuid-xxx
```

## update

Update an issue. Supports setting parent and changing state.

```bash
# Set parent
bun <skill-dir>/scripts/linear-issue.ts update WOR-43 --parent WOR-40

# Change state
bun <skill-dir>/scripts/linear-issue.ts update WOR-43 --state "In Progress"

# Combined
bun <skill-dir>/scripts/linear-issue.ts update WOR-43 --parent WOR-40 --state "Todo"
```

## comment

Add a comment to an issue.

```bash
bun <skill-dir>/scripts/linear-issue.ts comment WOR-43 --body "Initial implementation complete"
bun <skill-dir>/scripts/linear-issue.ts comment WOR-43 --body-file /tmp/review.md
```

## teams / templates / states

Query Linear workspace info, useful for debugging or manual config.

```bash
bun <skill-dir>/scripts/linear-issue.ts teams      # key  name  id
bun <skill-dir>/scripts/linear-issue.ts templates   # name  id
bun <skill-dir>/scripts/linear-issue.ts states      # name  type  id
```

## api

Execute arbitrary GraphQL queries. Use when named commands don't cover your needs.

```bash
# Query all projects
bun <skill-dir>/scripts/linear-issue.ts api 'query { projects(first:10) { nodes { id name slugId } } }'

# Query with variables
bun <skill-dir>/scripts/linear-issue.ts api \
  'query($id: String!) { issue(id: $id) { id title description labels { nodes { name } } } }' \
  --vars '{"id": "issue-uuid"}'

# Query cycles
bun <skill-dir>/scripts/linear-issue.ts api 'query { cycles(first:5) { nodes { id name startsAt endsAt } } }'
```

Output is raw JSON for easy agent parsing. This is the escape hatch — any operation not covered by named commands can be done via `api`.
