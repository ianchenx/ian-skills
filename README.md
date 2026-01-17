# Ian Skills

Personal skill collection for Claude Code.

## Installation

```bash
npx add-skill your-github-username/ian-skills
```

Or in Claude Code:
```
/plugin marketplace add your-github-username/ian-skills
```

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
