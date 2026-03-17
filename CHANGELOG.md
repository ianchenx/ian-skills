# Changelog

## 0.1.5 - 2026-03-18

### Features
- Add spec-driven-dev: spec-driven development lifecycle (design → spec → issue), zero external dependencies, supports Linear/GitHub/local fallback

## 0.1.4 - 2026-03-17

### Refactor
- codex-agent: remove cross-skill coupling (Step 5 recommending codex-review)

## 0.1.3 - 2026-03-17

### Fixes
- codex-agent: change default reasoning from xhigh to high
- codex-agent: strengthen no-code-writing rule with explain-the-why

## 0.1.2 - 2026-03-17

### Fixes
- codex-agent: auto-select reasoning level without asking user
- codex-agent: simplify options reference with clear model listing

## 0.1.1 - 2026-03-17

### Fixes
- codex-agent: use baseDir pattern instead of hardcoded paths

### Chores
- Split marketplace plugins into dev-skills and generation-skills
- Fix deprecated installation commands in README

## 0.1.0 - 2026-03-17

### Features
- Add codex-agent: async Codex execution with codex-async wrapper script
- Add codex-review: multi-lens adversarial code review via Codex (Skeptic, Architect, Minimalist)
- Add handoff: session handoff via HANDOFF.md for context preservation
- Add release-skills: standardized release workflow with conventional commits
- Add ian-gemini-web: image generation via Gemini with auto watermark removal
