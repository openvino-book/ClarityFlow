# ClarityFlow Invariants (系统不变量)

I1. **身份恒定**：卡片 id 创建后永不变化 (UUID)。
I2. **时间流向**：createdAt ≤ updatedAt 永远成立。
I3. **幽灵防御**：
    - 软删除 (deletedAt != null) 的卡片必须在所有常规查询（列表/详情/统计）中默认被过滤。
    - 只有明确的“回收站”接口或数据恢复脚本允许访问软删除数据。
I4. **状态机单行道**：
    - 状态流转严格遵循：NEEDS_CLARIFICATION → CONFIRMED → IN_PROGRESS → DONE
    - 不允许跨级跳转（除非管理员强制介入，但MVP暂不考虑）。
I5. **持续完整性契约**（修复了“进入后清空”漏洞）：
    - 只要卡片状态属于 { CONFIRMED, IN_PROGRESS, DONE }，它 **必须始终** 拥有完整的核心字段（任务描述、验收标准、边界、关键人）。
    - 禁止在上述状态下通过 UPDATE 操作清空这些字段（即：校验逻辑不仅在迁移时触发，在编辑时也触发）。
I6. **导出完备性**：导出的 Markdown 必须包含成功标准、边界、风险、当前状态。
I7. **并发防覆盖**（新增）：
    - 所有更新操作必须基于“版本号（version/eTag）”或乐观锁机制。
    - 如果更新时的 version 与数据库当前 version 不一致，必须拒绝写入 (409 Conflict)。