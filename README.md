# Ian Skills

Personal skill collection for Claude Code / Antigravity / OpenCode.

## Installation

### Claude Code

```bash
npx add-skill ianchenx/ian-skills
```

Or:
```
/plugin marketplace add ianchenx/ian-skills
```

### Antigravity

```bash
cp -r skills/* ~/.gemini/antigravity/skills/
```

## Skills

### codex-agent

Delegate coding tasks to OpenAI Codex CLI. Async execution, parallel dispatch, session resume.

- Async task management via `codex-async` wrapper script
- Parallel execution of independent tasks
- Reasoning levels: xhigh (default), high, medium, low
- Sandbox modes: read-only, workspace-write, danger-full-access

### codex-review

Adversarial code review with multi-lens analysis via Codex.

- Three review lenses: Skeptic (bugs), Architect (structure), Minimalist (complexity)
- Verdict system: PASS / CONTESTED / REJECT
- Lead Judgment: accept or reject each finding with rationale
- Manual trigger only (`disable-model-invocation: true`)

### handoff

Session handoff for context preservation across Claude instances.

- Writes `HANDOFF.md` in project root before ending complex sessions
- Template: Current State / What Worked / What Failed / Open Issues / Next Steps
- Overwrites each time — history preserved by git

### ian-gemini-web

Gemini Web image generation with **automatic watermark removal**.

```bash
npx -y bun scripts/main.ts --prompt "A cute cat" --image cat.png
```

- Image generation via Gemini Web
- Automatic watermark removal (Reverse Alpha Blending)
- Models: gemini-3-pro, gemini-2.5-pro, gemini-2.5-flash
- First run opens Chrome for Google authentication

## Credits

- Codex review adapted from [poteto/noodle adversarial-review](https://skills.sh/poteto/noodle/adversarial-review)
- Release workflow inspired by [baoyu-skills](https://github.com/JimLiu/baoyu-skills)
- Watermark removal from [gemini-watermark-remover](https://github.com/journey-ad/gemini-watermark-remover)

## License

MIT
