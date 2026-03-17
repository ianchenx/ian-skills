---
name: release-skills
description: Release workflow for skills repo. Use when releasing, bumping version, creating tags, or publishing changes. Trigger on "release", "发布", "new version", "bump version".
disable-model-invocation: true
---

# Release Skills

Standardized release workflow for the ian-skills repository.

## Workflow

### Step 1 — Detect Configuration

Scan the repo for version and changelog files:

1. Check for version file (priority order):
   - `package.json` → `$.version`
   - `VERSION` or `version.txt` → direct content
2. Scan for changelogs: `CHANGELOG*.md`
3. Display detected configuration

### Step 2 — Analyze Changes Since Last Tag

```bash
LAST_TAG=$(git tag --sort=-v:refname | head -1)
git log ${LAST_TAG}..HEAD --oneline
```

Categorize by conventional commit type:

| Type | Changelog | Description |
|---|---|---|
| `feat` | ✅ | New features |
| `fix` | ✅ | Bug fixes |
| `docs` | ✅ | Documentation |
| `refactor` | ✅ | Code refactoring |
| `perf` | ✅ | Performance |
| `chore` | ❌ | Maintenance (skip in changelog) |

Breaking change detection:
- Commit contains `BREAKING CHANGE` → warn user, suggest `--major`

### Step 3 — Determine Version Bump

Priority order:
1. User flag `--major/--minor/--patch` → use specified
2. BREAKING CHANGE → major (1.x.x → 2.0.0)
3. `feat:` present → minor (1.2.x → 1.3.0)
4. Otherwise → patch (1.2.3 → 1.2.4)

### Step 4 — Group Changes by Skill

Group commits by affected skill directory:

```
codex-agent:
  - feat: add reasoning level selection
  → Commit: feat(codex-agent): add reasoning level selection

codex-review:
  - fix: improve skeptic lens prompt
  → Commit: fix(codex-review): improve skeptic lens prompt
```

### Step 5 — Generate Changelog

For each detected changelog file, generate entries in the file's language.
Insert at file head, preserve existing content.

Format:
```markdown
## {VERSION} - {YYYY-MM-DD}

### Features
- Description of feature

### Fixes
- Description of fix
```

Only include sections with changes. Omit empty sections.

### Step 6 — Commit Each Skill Separately

For each skill with changes:
```bash
git add skills/<skill-name>/*
git commit -m "<type>(<skill-name>): <description>"
```

### Step 7 — User Confirmation

Before creating release commit, show the user:
1. Commits created
2. Changelog preview
3. Proposed version

Ask: confirm version bump and whether to push.

### Step 8 — Create Release Commit and Tag

```bash
git add <version-file> CHANGELOG*.md
git commit -m "chore: release v{VERSION}"
git tag v{VERSION}
```

If user confirmed push:
```bash
git push origin main
git push origin v{VERSION}
```

## Options

| Flag | Description |
|---|---|
| `--dry-run` | Preview changes without executing |
| `--major` | Force major version bump |
| `--minor` | Force minor version bump |
| `--patch` | Force patch version bump |

## Dry-Run Mode

When `--dry-run` is specified, show full preview of what would happen
(commits, changelog, version bump) without making any changes.
