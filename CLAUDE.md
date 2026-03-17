# Ian Skills

Personal skill collection for Claude Code / Antigravity / OpenCode.

## Structure

```
ian-skills/
├── .claude-plugin/
│   └── marketplace.json    # Plugin config (dev-skills + generation-skills)
├── .claude/
│   └── skills/
│       └── release-skills/ # Release workflow (internal, not published)
├── skills/
│   ├── codex-agent/        # Async Codex task delegation
│   ├── codex-review/       # Multi-lens adversarial review via Codex
│   ├── handoff/            # Session handoff (HANDOFF.md)
│   ├── ian-gemini-web/     # Gemini Web image generation
│   └── spec-driven-dev/    # Spec-driven dev lifecycle
├── CHANGELOG.md
└── README.md
```

## Plugin Groups

- **dev-skills**: codex-agent, codex-review, handoff
- **generation-skills**: ian-gemini-web

## Available Skills

| Skill | Description | Trigger |
|---|---|---|
| codex-agent | Delegate coding tasks to Codex CLI (async, parallel) | coding tasks, bug fixes, refactors |
| codex-review | Adversarial review: Skeptic / Architect / Minimalist | "review", "审查", "check the code" |
| handoff | Write HANDOFF.md for context preservation | session wrap-up, context overflow |
| ian-gemini-web | Image generation via Gemini Web + watermark removal | image generation backend |
| spec-driven-dev | Design → spec → issue lifecycle | "讨论下", "写 spec", "开 issue", "设计一下" |
| release-skills | Standardized release workflow (internal) | "release", "发布", "bump version" |

## Development

- Version tracked in `.claude-plugin/marketplace.json`
- Changelog in `CHANGELOG.md` (conventional commits)
- Release via `release-skills` skill
