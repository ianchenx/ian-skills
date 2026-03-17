# Linear Backend

Issue 管理通过 `linear-graphql-cli` 实现。本文件是所有 Linear 操作的命令参考。

## 初始化（首次使用时）

```bash
# 查 team ID
linear-graphql-cli query/teams '{"first":10,"_select":"nodes { id name key }"}'

# 查 issue 模板 ID
linear-graphql-cli query/templates '{"_select":"id name"}'

# 查 workflow states（获取 Done 等状态 ID）
linear-graphql-cli query/workflowStates '{"first":20,"_select":"nodes { id name type }"}'
```

## 查重

```bash
linear-graphql-cli query/issues '{"first":20,"_select":"nodes { identifier title url state { name } }"}'
```

按关键词搜索：
```bash
linear-graphql-cli query/issues '{"first":10,"filter":{"title":{"contains":"关键词"}},"_select":"nodes { identifier title state { name } }"}'
```

## 创建 Issue

使用 `templateId` 引用 Linear 平台配置的模板，`description` 覆盖模板占位符：

```bash
linear-graphql-cli mutation/issueCreate '{"input":{"teamId":"TEAM_ID","templateId":"TEMPLATE_ID","title":"type(scope): 描述","description":"按模板结构填写的具体内容"}}'
```

可用模板：

| 模板名 | 用途 | 结构 |
|---|---|---|
| 设计方案 (design) | design() issue | 问题 → 方案 → 数据模型 → 执行流程 → 范围 → 验证方式 |
| 功能任务 (feat) | feat() issue | 范围 → 原因 → 交付物 → 验证方式 → 不做什么 → 规模 |
| 缺陷修复 (fix) | fix() issue | 复现步骤 → 预期行为 → 实际行为 → 范围 |
| 重构 (refactor) | refactor() issue | 重构目标 → 目标状态 → 约束 |

## 设置 Parent 关系

```bash
linear-graphql-cli mutation/issueUpdate '{"id":"ISSUE_ID","input":{"parentId":"PARENT_ID"}}'
```

## 关闭 Issue

```bash
linear-graphql-cli mutation/issueUpdate '{"id":"ISSUE_ID","input":{"stateId":"DONE_STATE_ID"}}'
```
