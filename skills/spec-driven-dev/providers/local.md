# Local Provider

无 issue tracker 时，在 spec 文件末尾维护本地任务清单。

## 任务格式

在 spec 文件末尾添加 `## Tasks` 段：

```markdown
## Tasks
- [ ] feat(scope): 描述 — Size: S
- [ ] feat(scope): 描述 — Size: M — Blocked by: 上一条
- [ ] fix(scope): 描述 — Size: S
```

## 字段说明

| 字段 | 格式 | 说明 |
|---|---|---|
| 状态 | `[ ]` / `[x]` | 未完成 / 已完成 |
| Title | `type(scope): 描述` | 同 issue title 命名规范 |
| Size | `S` / `M` / `L` | 实现规模估算 |
| Blocked by | 任务描述 | 可选，标注依赖关系 |

## 操作映射

| spec-driven-dev 需要的操作 | 本地操作 |
|---|---|
| 查重 | 在 spec 文件的 `## Tasks` 段搜索 |
| 创建任务 | 在 `## Tasks` 段追加一行 |
| 设置依赖 | 用 `Blocked by:` 标注 |
| 完成任务 | 将 `[ ]` 改为 `[x]` |

## 注意事项

- 本地模式不创建 design issue — 设计讨论的过程记录直接写在 spec 文件的设计决策段
- Spec 文件是唯一的 source of truth
