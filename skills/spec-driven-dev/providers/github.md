# GitHub Provider

spec-driven-dev 的 issue 操作通过 `gh` CLI 执行。

## 前提

- `gh` CLI 已安装且已认证（`gh auth status`）

## 操作映射

| spec-driven-dev 需要的操作 | gh 命令 |
|---|---|
| 查重 | `gh issue list --search "关键词"` |
| 创建 issue | `gh issue create --title "feat(scope): ..." --body-file /tmp/body.md --label "feat"` |
| 关闭 issue | `gh issue close <number>` |
| 添加评论 | `gh issue comment <number> --body-file /tmp/comment.md` |
| 设置 label | `gh issue edit <number> --add-label "label"` |
| 关联 milestone | `gh issue edit <number> --milestone "v1.0"` |

## Label 组织策略

GitHub Issues 没有 parent-child 关系，用 label 模拟层级：

| Label | 用途 |
|---|---|
| `design` | design() issue，设计讨论阶段 |
| `feat` / `fix` / `refactor` | 任务类型，对应 issue title 前缀 |
| `spec:NNN-title` | 关联到同一个 spec 的所有 issue，替代 parent 关系 |
| `size:S` / `size:M` / `size:L` | 实现规模估算 |
| `blocked` | 有依赖未完成 |

创建 label：
```bash
gh label create "spec:001-auth" --description "Spec: 认证重构" --color 0E8A16
gh label create "size:S" --color C5DEF5
```

## Milestone 用法

当一个 spec 拆出多个 issue 时，用 milestone 跟踪整体进度：

```bash
# 创建 milestone
gh api repos/{owner}/{repo}/milestones -f title="001-auth-refactor" -f description="认证重构"

# 创建 issue 时关联
gh issue create --title "feat(auth): ..." --body-file /tmp/body.md --milestone "001-auth-refactor"
```

## 注意事项

- 没有 issue template ID 机制 — body 中直接写完整内容
- 多行 body 使用 `--body-file`（写临时文件），避免 shell 转义问题
- 用 `spec:NNN` label 将同一 spec 下的所有 issue 关联起来
