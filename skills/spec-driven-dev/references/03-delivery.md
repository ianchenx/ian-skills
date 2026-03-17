# 阶段 3: 交付准备

把 spec 或需求转化为可执行的 issue。

## 复杂度评估

| 复杂度 | 信号 | 策略 |
|---|---|---|
| **简单** | 单模块，改动 <100 行，无依赖 | 1 个 issue |
| **中等** | 2-3 个模块，有明确的阶段划分 | 1 个 parent + 2-3 个 sub-issues |
| **复杂** | 跨 4+ 模块，有前后依赖关系 | 先拆阶段，再为每个阶段创建 issue |

## Issue 格式

### Title

使用 conventional commit 风格的 type 前缀，让 issue 列表一目了然：

```
feat(scope): 一句话描述做什么
fix(scope): 一句话描述修什么
design(scope): 一句话描述要决策什么
refactor(scope): 一句话描述要重构什么
```

### Body

Issue body 使用 issue tracker 的模板（如有）。按需在 body 末尾追加：
- **依赖** — 多 issue 时补 Blocks / Blocked by
- **参考** — 有 spec 时补 `Spec: <specDir>/NNN-title.md`

## 创建流程

具体命令参见对应的 `providers/<provider>.md`。

### 1. 查重

创建前先搜索是否已有相同或类似 issue。如果已存在类似 issue，询问用户是更新还是新建。

### 2. Draft → 确认 → 创建

1. 根据 spec 的 v1 范围确定需要几个 issue
2. 用 draft 形式先展示给用户（title + body 概要），**确认后再创建**
3. 创建 issue（使用模板 + 覆盖占位符）
4. 如有 parent issue，创建关联
5. 关闭 design issue（如有，spec 已替代设计讨论的产出）
6. 每个 issue 关联 spec 文件（在 References 里放 spec 路径）

### 3. 多 issue 时的总结

创建多个 issue 后，输出全貌总结：

- 列出所有创建的 issue（identifier + title + URL）
- 标注 Dependencies 关系（谁 blocks 谁）
- 建议实现顺序（先做无依赖的，再做有依赖的）

## 检查清单

创建前确认：
- [ ] 查重完成，无重复 issue
- [ ] Title 使用了正确的 `type(scope):` 前缀
- [ ] Issue body 包含 spec 链接
- [ ] 每个 issue 有独立的 Acceptance Criteria
- [ ] Dependencies 已标注（Blocks / Blocked by）
- [ ] Implementation Size 已标注
- [ ] 复杂需求已拆分为可独立执行的 sub-issues
- [ ] 用户已确认 draft 后才创建

## Spec 闭环

Issues 创建后并不是终点。当实现完成并合并后：

1. 对照 spec 的验收标准（AC-01, AC-02...）验证实现
2. 更新 spec 状态 — 在 spec 文件头部添加 `status: implemented`
3. 如有未满足的 AC，创建 follow-up issue
