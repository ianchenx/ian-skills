# Ian Skills

Personal skill collection for Claude Code / OpenCode.

## Installation

### Claude Code

```bash
npx add-skill ianchenx/ian-skills
```

Or:
```
/plugin marketplace add ianchenx/ian-skills
```

## Skills

### ian-gemini-web

Gemini Web image generation with **automatic watermark removal**.

**OpenCode Installation:**

> Please install the skill from github.com/ianchenx/ian-skills/skills/ian-gemini-web to ~/.config/opencode/skill

**Usage:**

```bash
npx -y bun scripts/main.ts --prompt "A cute cat" --image cat.png
```

**Features:**
- Image generation via Gemini Web
- Automatic watermark removal (Reverse Alpha Blending)
- Models: gemini-3-pro, gemini-2.5-pro, gemini-2.5-flash

**First run:** Opens Chrome for Google authentication. Cookies cached for subsequent runs.

## Credits

- Based on [baoyu-skills](https://github.com/JimLiu/baoyu-skills)
- Watermark removal from [gemini-watermark-remover](https://github.com/journey-ad/gemini-watermark-remover)

## License

MIT
