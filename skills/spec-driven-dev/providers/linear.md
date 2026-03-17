# Linear Provider

spec-driven-dev 的 issue 操作委托给 **linear skill** 执行。

## 前提

- `linear` skill 已安装并完成 setup（有可用的 `config.json`）

## 操作映射

| spec-driven-dev 需要的操作 | linear skill 命令 |
|---|---|
| 查重（创建前搜索） | `search "<关键词>"` |
| 创建 design issue | `create --title "design(scope): ..." --body-file /tmp/body.md --template design` |
| 创建 feat/fix/refactor issue | `create --title "feat(scope): ..." --body-file /tmp/body.md --template feat` |
| 设置 parent 关系 | `update <child-id> --parent <parent-id>` |
| 关闭 issue | `update <id> --state "Done"` |
| 添加评论 | `comment <id> --body "..."` |

## 调用方式

通过 linear skill 的 `scripts/linear.ts` 执行。具体路径取决于 skill 安装位置，由 agent 框架自行定位。

```bash
bun <linear-skill>/scripts/linear.ts <command> [args]
```

## 注意事项

- 创建 issue 前**必须先 search 查重**
- 多行 body 使用 `--body-file`（写临时文件），避免 shell 转义问题
- 创建 issue 后输出包含 `id`，用于后续 `update` 操作
