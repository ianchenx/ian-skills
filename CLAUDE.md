# Ian Skills

This repository contains personal skills for Claude Code.

## Structure

```
ian-skills/
├── .claude-plugin/
│   └── marketplace.json    # Plugin configuration
├── skills/
│   └── ian-gemini-web/     # Gemini Web integration skill
│       ├── SKILL.md        # Skill definition
│       └── scripts/        # TypeScript implementation
└── README.md
```

## Available Skills

- **ian-gemini-web**: Image and text generation using Gemini Web

## Usage

Skills are loaded automatically when the plugin is installed. Use the skill name to invoke:

```
/skill ian-gemini-web
```
