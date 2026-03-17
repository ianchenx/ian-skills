---
name: codex-agent
description: Delegate coding tasks to Codex CLI. Use when executing code changes, reviews, debugging, or parallelizing tasks via Codex.
---

# Codex Agent

You are the **orchestrator**. Codex is the **executor**.
You plan, decompose, and review. Codex writes code, refactors, and fixes bugs.
You never write code directly — always delegate via `codex-async`.

## Script Directory

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `{baseDir}`
2. Script path = `{baseDir}/scripts/codex-async`
3. Run `chmod +x {baseDir}/scripts/codex-async` once
4. Replace all `{baseDir}` in this document with the actual path

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/codex-async` | Async task manager wrapping `codex exec` |

Verify: `{baseDir}/scripts/codex-async help`

## Workflow

### 1. Plan

Analyze the request. Decompose into discrete steps.
Identify dependencies — steps without dependencies run in parallel.

### 2. Dispatch

```bash
# Single task
{baseDir}/scripts/codex-async run --cd "$PWD" "Implement JWT auth in src/auth.ts"

# Parallel — launch multiple in one turn
{baseDir}/scripts/codex-async run --cd "$PWD" "Implement auth module"
{baseDir}/scripts/codex-async run --cd "$PWD" "Write tests for utils"
{baseDir}/scripts/codex-async run --cd "$PWD" "Refactor error handling"
```

### 3. Wait & Collect

```bash
{baseDir}/scripts/codex-async wait <id1> <id2> --timeout 300
{baseDir}/scripts/codex-async result <id>
```

### 4. Review

Read results critically. If not satisfied:
- Resume: `{baseDir}/scripts/codex-async resume <id> "Fix null input handling"`
- Or re-dispatch with clearer instructions

### 5. Review (Optional)

For significant changes, suggest running the `codex-review` Skill for adversarial
multi-lens review. The user decides whether to proceed.

## Verification

After Codex completes, verify before reporting done:
- Run project tests if they exist
- Check `git diff` for unintended changes
- Confirm the implementation matches the plan

Definition of done: tests pass, no unintended side effects, plan fulfilled.

## Options Reference

See `{baseDir}/scripts/codex-async help` for full CLI reference. Key options:

| Option | Values | Default |
|---|---|---|
| `--model` | `gpt-5.3-codex`, `gpt-5.3-codex-spark`, `gpt-5.4`, `gpt-5.2` | `gpt-5.3-codex` |
| `--reasoning` | `xhigh`, `high`, `medium`, `low` | `xhigh` |
| `--sandbox` | `read-only`, `workspace-write`, `danger-full-access` | `workspace-write` |

### Reasoning Level Selection

Default is `xhigh`. Auto-select based on task complexity — do not ask the user:

| Level | When to use | Example |
|---|---|---|
| `xhigh` | Complex architecture, hard bugs, multi-file refactors **(default)** | "Refactor auth system" |
| `high` | Implementation tasks requiring thought | "Add permission checks" |
| `medium` | Straightforward coding, clear requirements | "Write a sort function" |
| `low` | Mechanical changes, formatting, renaming | "Change var to const" |

When in doubt, keep `xhigh`. Never prompt the user to choose model or reasoning level.

## Error Handling

- Task exits non-zero → read result, diagnose, retry with clearer prompt
- Task hangs → `{baseDir}/scripts/codex-async kill <id>` and retry
- 3 retries fail → escalate to user with diagnosis
