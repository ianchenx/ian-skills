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

### OpenCode

Tell OpenCode:

> Clone https://github.com/ianchenx/ian-skills to ~/.config/opencode/skill/ian-skills, then restart opencode.

## Skills

### ian-gemini-web

Gemini Web image generation with **automatic watermark removal**.

```bash
# Generate image
npx -y bun scripts/main.ts --prompt "A cute cat" --image cat.png

# From prompt files
npx -y bun scripts/main.ts --promptfiles system.md content.md --image out.png
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
