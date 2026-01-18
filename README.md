# ClarityFlow

<div align="center">

**Production-grade task clarification system for white-collar workers**

[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

## 📖 简介

ClarityFlow 是一款任务澄清系统，帮助团队在执行任务前明确目标、定义成功标准、识别风险。通过标准化的工作流（澄清 → 确认 → 执行 → 完成），减少沟通成本，提高交付质量。

### 🎯 核心价值

- **任务澄清** - 在动手前明确"做什么"和"为什么"
- **成功标准** - 用 Definition of Done (DoD) 量化完成标准
- **风险识别** - 提前预判可能影响交付的因素
- **范围边界** - 明确哪些内容不在本次任务范围内，防止范围蔓延

## ✨ 功能特性

### 📋 看板式任务管理
- **四阶段工作流**：待澄清 → 已确认 → 进行中 → 已完成
- **拖拽友好**：类似 Trello 的看板布局（移动端支持横向滚动）
- **状态可视化**：颜色编码的状态标签和卡片边框

### 📝 任务文档化
- **结构化字段**：
  - 背景与问题 (Problem)
  - 成功标准 (Definition of Done)
  - 边界 (Out of Scope)
  - 关键人 (Stakeholders)
  - 风险 (Risks)
  - 截止日期 (Due Date)
- **必填字段保护**：流转到已确认状态时，系统会强制检查核心字段完整性
- **只读保护**：已完成的任务自动锁定字段

### 🔄 状态流转
- **单向流转**：NEEDS_CLARIFICATION → CONFIRMED → IN_PROGRESS → DONE
- **乐观锁**：基于版本号的并发控制，防止覆盖冲突
- **字段完整性校验**：I5 约束确保 CONFIRMED+ 状态的任务必含核心字段

### 📤 Markdown 导出
- 一键导出任务文档为 Markdown 格式
- 包含完整上下文、风险、边界信息
- 支持复制到文档系统（Notion、Confluence 等）

### 🎨 现代化 UI
- **Modern SaaS 风格**：参考 Linear/Notion 的设计语言
- **响应式布局**：完美支持桌面和移动设备
- **沉浸式编辑**：文档风格的详情页，专注内容创作

## 🛠️ 技术栈

### 后端
- **Runtime**: Node.js 20+
- **Framework**: Express + TypeScript
- **Database**: SQLite + Prisma ORM
- **Validation**: Zod
- **Testing**: Jest

### 前端
- **Runtime**: React 19
- **Build Tool**: Vite
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v3
- **UI Components**: Custom component library
- **Icons**: Lucide React

### DevOps
- **Container**: Docker + Docker Compose
- **Version Control**: Git

## 📦 安装与运行

### 前置要求

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Git**（可选，用于克隆代码）

### 本地开发

#### 1. 克隆仓库

```bash
git clone <repository-url>
cd ClarityFlow
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 初始化数据库

```bash
npx prisma migrate dev
```

#### 4. 启动开发服务器

```bash
# 同时启动 API 和 Web
npm run dev

# 或分别启动
npm run dev:api  # API 服务运行在 http://localhost:3000
npm run dev:web  # Web 服务运行在 http://localhost:5173
```

#### 5. 访问应用

打开浏览器访问：**http://localhost:5173**

### Docker 部署（推荐用于生产）

#### 使用 Docker Compose（推荐）

```bash
# 构建并启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止容器
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

#### 使用 Docker 命令

```bash
# 构建镜像
docker build -t clarityflow .

# 运行容器
docker run -d \
  -p 8080:3000 \
  -v ./prisma/dev.db:/app/prisma/dev.db \
  --name clarityflow \
  clarityflow

# 查看日志
docker logs -f clarityflow

# 停止并删除容器
docker stop clarityflow
docker rm clarityflow
```

#### 访问生产应用

启动后访问：**http://localhost:8080**

## 📚 使用指南

### 创建任务

1. 点击右上角 **"New Card"** 按钮
2. 填写任务标题（必填）
3. 点击 **"创建"** 进入详情页

### 编辑任务文档

1. 在看板上点击任意任务卡片
2. 编辑以下字段：
   - **背景与问题** - 详细说明任务背景和当前问题（必填，状态流转需要）
   - **成功标准** - 定义验收标准（必填，状态流转需要）
   - **边界** - 明确排除的内容（可选）
   - **关键人** - 涉及的团队或个人（可选）
   - **风险** - 可能影响交付的因素（可选）
   - **截止日期** - 任务截止时间（可选）
3. 点击 **"保存更改"**

### 推进任务状态

在任务详情页右上角：
- **确认任务** (待澄清 → 已确认) - 确保核心字段已填写
- **开始执行** (已确认 → 进行中) - 标记任务进入开发阶段
- **标记完成** (进行中 → 已完成) - 任务完成后锁定字段

### 导出任务文档

1. 打开任务详情页
2. 点击右上角 **"Export"** 按钮
3. 在弹窗中复制 Markdown 内容
4. 粘贴到文档系统（Notion、Confluence 等）

## 🏗️ 项目结构

```
ClarityFlow/
├── apps/
│   ├── api/              # Express API 后端
│   │   ├── src/
│   │   │   ├── routes/   # API 路由
│   │   │   ├── services/ # 业务逻辑
│   │   │   ├── middleware/# 中间件
│   │   │   └── app.ts    # Express 应用
│   │   └── prisma/       # Prisma schema
│   └── web/              # React 前端
│       ├── src/
│       │   ├── components/
│       │   │   └── ui/   # UI 组件库
│       │   ├── pages/    # 页面组件
│       │   └── lib/      # 工具函数
│       └── index.html
├── prisma/
│   ├── schema.prisma     # 数据库模型
│   └── dev.db            # SQLite 数据库（开发）
├── Dockerfile            # 多阶段 Docker 配置
├── docker-compose.yml    # Docker Compose 配置
└── README.md             # 本文件
```

## 🔧 开发指南

### 运行测试

```bash
# 运行所有测试
npm test

# 仅运行 API 测试
npm run test:api
```

### 代码检查

```bash
# 运行 ESLint
npm run lint

# 自动修复问题
npm run lint:fix
```

### 数据库迁移

```bash
# 创建迁移
npx prisma migrate dev --name <migration-name>

# 重置数据库（开发环境）
npx prisma migrate reset

# 生成 Prisma Client
npx prisma generate
```

### 构建

```bash
# 构建所有应用
npm run build

# 仅构建 API
npm run build -w apps/api

# 仅构建 Web
npm run build -w apps/web
```

## 🏛️ 系统架构

### 数据模型

**Card (任务卡片)**
- `id`: UUID（主键，不可变）
- `version`: 版本号（乐观锁）
- `status`: 状态机（NEEDS_CLARIFICATION | CONFIRMED | IN_PROGRESS | DONE）
- `problem`, `successCriteria`, `outOfScope`, `stakeholders`, `risks`: 业务字段
- `createdAt`, `updatedAt`: 时间戳
- `deletedAt`: 软删除标记

### 系统不变量 (Invariants)

1. **I1. Identity Constancy**: 卡片 ID 不可变
2. **I2. Time Flow**: 创建时间 ≤ 更新时间
3. **I3. Ghost Defense**: 软删除项默认从所有标准查询中过滤
4. **I4. State Machine**: 单向状态流转（不可逆）
5. **I5. Continuous Integrity**: CONFIRMED+ 状态必须包含核心字段
6. **I6. Export Completeness**: 导出必须包含上下文、风险、边界
7. **I7. Concurrency Protection**: 所有更新必须检查版本号

### API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/cards` | 获取所有任务 |
| GET | `/api/cards/:id` | 获取任务详情 |
| POST | `/api/cards` | 创建任务 |
| PATCH | `/api/cards/:id` | 更新任务（乐观锁） |
| POST | `/api/cards/:id/transition` | 状态流转 |
| GET | `/api/cards/:id/export` | 导出 Markdown |
| DELETE | `/api/cards/:id` | 软删除任务 |
| GET | `/health` | 健康检查 |

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS 框架
- [Prisma](https://www.prisma.io) - 现代化 ORM
- [Vite](https://vitejs.dev) - 下一代前端构建工具
- [TanStack Query](https://tanstack.com/query) - 强大的数据同步库

---

**Built with ❤️ for productive teams**
