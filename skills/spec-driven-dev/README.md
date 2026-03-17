# spec-driven-dev

从想法到可执行任务的完整生命周期管理。

## Setup

首次使用时 skill 会询问你想用哪个 issue tracker，并创建 `config.json`：

| Provider | 需要 |
|---|---|
| Linear | `linear` skill 已配置 |
| GitHub | `gh` CLI 可用 |
| 本地 | 无依赖 — 在 spec 文件内维护 `## Tasks` 清单 |

Config 结构：
```json
{ "provider": "linear", "specDir": "docs/specs" }
```

## 这个 skill 做什么

根据用户意图和需求复杂度，自动路由到合适的深度：

| 你说 | skill 做什么 |
|---|---|
| "讨论下 X" / "这个怎么做" | 评估复杂度 → 设计讨论 → spec → 创建任务 |
| "写个 spec" | 直接撰写 spec 文件 |
| "开 issue" / "拆任务" | 根据 spec 创建任务 |
| "我想加个 X 功能" | 评估复杂度 → 跳到对应阶段 |

## 文件结构

```
spec-driven-dev/
├── SKILL.md                     ← 入口：意图识别 + 复杂度路由 + setup
├── README.md                    ← 本文件
├── config.json                  ← 当前项目配置（provider + specDir）
├── providers/
│   ├── linear.md                ← Linear 命令参考
│   ├── github.md                ← GitHub CLI 命令参考
│   └── local.md                 ← 本地模式说明
└── references/
    ├── 01-design.md             ← 阶段 1: 设计讨论方法论
    ├── 02-spec.md               ← 阶段 2: spec 撰写原则
    ├── 03-delivery.md           ← 阶段 3: 交付流程（工具无关）
    └── templates.md             ← spec 文件模板
```

## 扩展

添加新 provider：参考 `providers/` 下现有文件的格式创建同名 `.md`，然后在 `config.json` 中指定 `"provider"`。
