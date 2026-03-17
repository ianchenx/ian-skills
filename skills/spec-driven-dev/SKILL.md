---
name: spec-driven-dev
description: 新功能的规划→spec→issue 生命周期。当用户说"讨论下"、"写 spec"、"开 issue"、"怎么做"、"设计一下"、"拆任务"、或描述新功能需求时触发。
---

# Spec-Driven Development

在写代码之前，把"做什么、不做什么、怎么算做完"想清楚写下来。投入多少取决于复杂度 — 简单的事不需要重型流程，复杂的事不能跳过设计。

## 意图识别

| 用户意图 | 入口 |
|---|---|
| "讨论下 X" / "这个怎么做" / "评估一下方案" | → 复杂度评估 → 对应阶段 |
| "写个 spec" / "出个规格" | → 直接进阶段 2 |
| "开 issue" / "拆任务" / "创建 issue" | → 直接进阶段 3 |
| "我想加个 X 功能" / 描述一个需求 | → 复杂度评估 → 对应阶段 |

## 复杂度评估

**简单** — 单模块、改动可预见、需求清晰
→ 跳过设计和 spec，直接创建 1 个 issue

**中等** — 2-3 个模块、需要明确范围和边界
→ 写 spec（含设计决策段），然后创建 issue

**复杂** — 跨多模块、有多个可选方案、需要取舍决策
→ 先创建 design() issue → 讨论 → 写 spec → 拆分 issues

判断不了时默认中等 — 写 spec 的成本远低于返工成本。

## 核心产出：一个 spec 文件

**一个文件贯穿整个生命周期**，用 frontmatter 的 `status` 标记进展：

```
status: design       ← 阶段 1 产出：问题 + 设计决策
status: spec         ← 阶段 2 产出：补全目标、约束、范围、验证方式
status: ready        ← 阶段 3 产出：任务已创建（issue 或本地清单）
status: implemented  ← 实现合并并验证后
```

过程记录不在文件里 — **design() issue 是讨论过程的留底**（无 issue tracker 时跳过）。

## Issue Tracker 检测

阶段 1 和 3 需要创建 issue。按以下顺序检测可用工具：

1. `linear-graphql-cli` 可用 → 读 [references/linear.md](references/linear.md)
2. `gh` 可用 → 用 GitHub Issues
3. 都不可用 → 本地模式：在 spec 文件末尾维护 `## Tasks` 清单

本地模式的任务格式：
```markdown
## Tasks
- [ ] feat(scope): 描述 — Size: S/M/L
- [ ] fix(scope): 描述 — Blocked by: 上一条
```

## 三个阶段

每个阶段完成后，**问用户是否继续到下一阶段**。

### 阶段 1: 设计讨论（复杂需求）

- **输入：** 用户的模糊需求或多方案选择题
- **方法论：** [references/01-design.md](references/01-design.md)
- **产出：** `docs/specs/NNN-title.md`（status: design）+ `design()` issue
- **停止条件：** 用户确认设计方案，design() issue 已创建

### 阶段 2: 撰写 Spec（中等及以上需求）

- **输入：** status: design 的 spec 文件，或用户直接描述的需求
- **方法论和模板：** [references/02-spec.md](references/02-spec.md)
- **产出：** 同一文件更新为 status: spec，补全目标、约束、范围、验证方式等
- **同时：** 关闭 design() issue（如有）
- **停止条件：** spec 内容获用户确认

### 阶段 3: 交付准备（所有需求）

- **输入：** status: spec 的文件，或简单需求的直接描述
- **方法论：** [references/03-delivery.md](references/03-delivery.md)
- **产出：** 任务创建（issue 或本地清单），文件更新为 status: ready
- **停止条件：** 所有任务创建完毕 + 输出全貌总结

> ⚠️ **阶段 3 有副作用**（远程模式）— 会创建真实 issue。创建前必须先展示 draft 给用户确认。

## 生命周期闭环

merge 后：
1. 对照 spec 的验证方式逐条验证实现
2. 全部通过 → 更新 status: implemented
3. 部分未满足 → 创建 follow-up issue，关联原 spec

## 约束

- **每个阶段可独立进入** — 用户说"写个 spec"就直接进阶段 2
- **draft → 确认 → 持久化** — 每个阶段的产出先展示 draft，确认后才写文件或创建 issue
- **产出比流程重要** — 目标是 agent 能独立执行的文档，流程只是手段
