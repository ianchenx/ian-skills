---
name: codex-review
description: Multi-lens adversarial review via Codex. Trigger on "review", "审查", "check the code".
disable-model-invocation: true
---

# Codex Review

Spawn Codex as adversarial reviewer to challenge work from distinct lenses.
The deliverable is a synthesized verdict — do not make changes during review,
because mixing review and editing in one pass makes it impossible to evaluate
whether the original work was sound.

## Step 1 — Determine Scope and Intent

Before spawning reviewers, determine:
1. **What to review**: recent diffs, referenced plans, or specific files
2. **The intent**: what the author is trying to achieve

This is critical: reviewers challenge whether the work achieves the intent well,
not whether the intent is correct. State the intent explicitly before proceeding.

Assess change size to decide review depth:
- Small (1-3 files, <100 lines) → single Skeptic pass
- Medium (3-10 files) → Skeptic + one other lens
- Large (10+ files, refactor, migration) → all three lenses in parallel

## Step 2 — Spawn Codex Reviewers

```bash
codex exec --sandbox read-only --skip-git-repo-check \
  "<lens prompt with diff context>" 2>/dev/null
```

For parallel execution (large reviews):
```bash
codex exec --sandbox read-only --skip-git-repo-check "<skeptic prompt>" 2>/dev/null &
codex exec --sandbox read-only --skip-git-repo-check "<architect prompt>" 2>/dev/null &
codex exec --sandbox read-only --skip-git-repo-check "<minimalist prompt>" 2>/dev/null &
wait
```

## Step 3 — Reviewer Lenses

Each reviewer gets a single prompt containing:
1. The stated intent (from Step 1)
2. Their assigned lens (below)
3. The code or diff to review
4. The instruction block

### Skeptic

Focus: Find bugs, failures, and incorrect assumptions.

> You are an adversarial reviewer with a Skeptic lens.
> Your job is to find real problems, not validate the work.
> Focus on: null/undefined access, off-by-one errors, race conditions,
> uncaught exceptions, missing error paths, incorrect assumptions about data shape,
> security issues (injection, auth bypass, sensitive data exposure).
> Be specific — cite files, lines, and concrete failure scenarios.
> Rate each finding: **high** (blocks ship), **medium** (should fix), **low** (worth noting).
> Write findings as a numbered markdown list.

### Architect

Focus: Structural integrity, boundaries, and long-term maintainability.

> You are an adversarial reviewer with an Architect lens.
> Your job is to challenge structural decisions, not validate them.
> Focus on: boundary violations, leaky abstractions, coupling between modules,
> breaking changes to public APIs, missing idempotency, shared state mutations,
> scalability concerns, and whether the design exhausts alternatives.
> Be specific — cite files, lines, and concrete architectural risks.
> Rate each finding: **high** (blocks ship), **medium** (should fix), **low** (worth noting).
> Write findings as a numbered markdown list.

### Minimalist

Focus: Unnecessary complexity, dead code, and over-engineering.

> You are an adversarial reviewer with a Minimalist lens.
> Your job is to find things that should be removed or simplified.
> Focus on: dead code, duplicated logic, unnecessary abstractions,
> features that could be deferred, over-generic solutions for specific problems,
> config/options that nobody uses, and code that exists "just in case".
> Be specific — cite files, lines, and what to remove or simplify.
> Rate each finding: **high** (blocks ship), **medium** (should fix), **low** (worth noting).
> Write findings as a numbered markdown list.

## Step 4 — Synthesize Verdict

Read each reviewer's output. Deduplicate overlapping findings.
Produce a single verdict:

```markdown
## Intent
<what the author is trying to achieve>

## Verdict: PASS | CONTESTED | REJECT
<one-line summary>

## Findings
<numbered list, ordered by severity high → medium → low>
For each:
- **[severity]** Description with file:line references
- Lens: which reviewer raised it
- Recommendation: concrete action, not vague advice

## What Went Well
<1-3 things reviewers found no issue with — acknowledge good work>
```

Verdict logic:
- **PASS** — no high-severity findings
- **CONTESTED** — high-severity findings but reviewers disagree on them
- **REJECT** — high-severity findings with reviewer consensus

## Step 5 — Lead Judgment

After synthesizing the reviewers, apply your own judgment.
Reviewers are adversarial by design — not every finding warrants action.

Append to the verdict:

```markdown
## Lead Judgment
<for each finding: accept or reject with a one-line rationale>
```

Call out false positives, overreach, and findings that mistake style for substance.
Let the user decide how to proceed on genuinely ambiguous findings.
