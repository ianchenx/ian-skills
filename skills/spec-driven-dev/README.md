# spec-driven-dev

从想法到可执行任务的完整生命周期管理。

## 零依赖即可使用

不需要任何外部工具。Skill 会自动检测可用的 issue tracker：

| 检测到 | 行为 |
|---|---|
| `linear-graphql-cli` | 用 Linear 管理 issue（参见 `references/linear.md`）|
| `gh` | 用 GitHub Issues |
| 都没有 | 本地模式：在 spec 文件内维护 `## Tasks` 清单 |

### 可选：配置 Linear

```bash
# 通过 uxc 链接 Linear API
uxc link linear-graphql-cli https://api.linear.app/graphql

# 验证
linear-graphql-cli query/teams '{"first":1,"_select":"nodes { name }"}'
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
├── SKILL.md                     ← 入口：意图识别 + 复杂度路由 + issue tracker 检测
├── README.md                    ← 本文件
└── references/
    ├── 01-design.md             ← 阶段 1: 设计讨论方法论
    ├── 02-spec.md               ← 阶段 2: spec 撰写原则
    ├── 03-delivery.md           ← 阶段 3: 交付流程（工具无关）
    ├── templates.md             ← spec 文件模板
    └── linear.md                ← Linear 命令参考（示例 issue tracker）
```

## 添加其他 issue tracker

在 `references/` 下创建对应文件（如 `github.md`、`jira.md`），包含以下操作的具体命令：

- 初始化（获取 project/team ID）
- 查重（搜索已有 issue）
- 创建 issue（使用模板）
- 设置 parent 关系
- 关闭 issue

然后在 SKILL.md 的「Issue Tracker 检测」段添加检测逻辑。
