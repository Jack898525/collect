# 2026-04-24 改动总结

## 一、今天完成的改动

### 1. 新增“定向问答”模块

新增页面：

- `src/pages/DirectedQA.vue`

实现内容：

- 新增首页 Tab：`定向问答`
- 前台展示管理员预设题目
- 学生可围绕某一道预设题目提交多条回答
- 当前题目下展示多条公开回答
- 已采纳回答在定向问答列表内展示标识
- 学生身份信息继续复用现有 `localStorage` 缓存

### 2. 首页接入新模块

修改文件：

- `src/pages/HomePage.vue`

实现内容：

- 保留原有 `QA 展示 / 排行榜 / 发布 QA`
- 新增第 4 个 Tab：`定向问答`

### 3. 后台扩展为三块管理区

修改文件：

- `src/pages/AdminView.vue`

实现内容：

- 保留原有“自由 QA”管理
- 新增“定向题目”管理
- 新增“定向回答”管理

后台新增能力：

- 创建定向题目
- 编辑定向题目
- 启用/停用定向题目
- 删除定向题目
- 查看定向回答
- 采纳/取消采纳定向回答
- 隐藏/恢复显示定向回答
- 删除定向回答

### 4. 定向回答采纳规则落地

新增文件：

- `src/lib/directedAnswers.ts`
- `src/lib/directedAnswers.test.ts`

实现内容：

- 同一学生可对同一定向题重复回答
- 但同一学生在同一题下最多只保留 1 条已采纳回答
- 当管理员采纳新回答时，系统会先取消该学生该题下旧的已采纳回答，再采纳当前回答

### 5. 排行榜改为合并计分

修改文件：

- `src/pages/Leaderboard.vue`

新增文件：

- `src/lib/leaderboard.ts`
- `src/lib/leaderboard.test.ts`

实现内容：

- 原自由 QA 的采纳数继续统计
- 新增定向问答采纳数统计
- 两者按 `student_id` 合并
- 排行榜展示总采纳数和总回答数

### 6. 新增数据库迁移

新增文件：

- `supabase/migrations/2026-04-24_add_directed_qa.sql`

实现内容：

- 新建 `directed_questions`
- 新建 `directed_answers`
- 新建 `directed_answers_public` 视图
- 增加定向回答相关索引

### 7. 新增文档

新增文件：

- `docs/superpowers/specs/2026-04-24-directed-qa-design.md`
- `docs/superpowers/plans/2026-04-24-directed-qa.md`
- `docs/superpowers/2026-04-24-change-summary.md`

用途：

- 留存设计说明
- 留存实现计划
- 留存本次改动总结

### 8. 增加测试运行能力

修改文件：

- `package.json`

实现内容：

- 增加 `vitest`
- 增加 `npm run test`

## 二、对原有功能的影响判断

不能做“绝对不影响”的保证。

我能给出的结论是：

- 本次改动是尽量收敛的外科手术式修改
- 原有自由 QA 页面 `QADisplay.vue` 和 `PublishQA.vue` 没有直接改动
- 首页只是新增一个 Tab，没有删除原有入口
- 自由 QA 后台功能保留，但 `AdminView.vue` 做了整页重写，因此这是本次对旧功能影响风险最大的文件
- 排行榜逻辑被改动，原有自由 QA 计分逻辑现在变成“自由 QA + 定向问答”的合并逻辑

所以更准确的说法是：

- 我已经尽量控制改动范围
- 当前证据表明没有出现编译级回归
- 但因为缺少真实 Supabase 环境和完整联调条件，不能保证线上行为 100% 不受影响

## 三、已经完成的验证

已完成：

- `npm run test -- src/lib/leaderboard.test.ts src/lib/directedAnswers.test.ts`
- `npm run build`
- 本地 Vite 服务启动成功
- 本地首页访问返回 `200`

验证结论：

- 新增的两个核心 helper 逻辑通过自动化测试
- Vue/TypeScript 构建通过
- 页面可以启动并访问

## 四、还没有完成的真实业务验证

当前尚未完成的部分，不是因为代码未写，而是因为环境条件不足：

- 本机没有真实 `VITE_SUPABASE_URL`
- 本机没有真实 `VITE_SUPABASE_ANON_KEY`
- 本机没有 `supabase` CLI
- 目标数据库尚未确认执行 `2026-04-24_add_directed_qa.sql`

因此以下流程还没有在真实数据库上完成闭环验证：

- 学生提交定向回答
- 后台创建定向题目
- 后台采纳定向回答
- 定向回答公开展示
- 排行榜联动更新

## 五、当前风险说明

### 1. 最大风险不是前端，而是环境缺失

如果没有真实 Supabase 配置和数据库迁移：

- 页面能打开
- 但定向问答的真实增删改查不能工作

### 2. 后台本身仍然没有真正鉴权

本次没有处理后台安全问题。

现状仍然是：

- 后台只是隐藏路由
- 不是正式的登录鉴权后台

所以本次改动可用于功能开发与验收，不应视为“已经满足正式上线安全要求”。

## 六、建议的下一步

1. 提供真实 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
2. 在目标 Supabase 执行 `supabase/migrations/2026-04-24_add_directed_qa.sql`
3. 用真实数据库重新验证以下流程：
   - 创建定向题目
   - 学生对同一题多次回答
   - 后台采纳更优回答
   - 旧采纳自动取消
   - 排行榜增加分数
4. 如需公网部署，再单独处理后台鉴权问题
