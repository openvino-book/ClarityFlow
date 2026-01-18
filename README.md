# ClarityFlow

<div align="center">

**Production-grade task clarification system for white-collar workers**

[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**[🇨🇳 中文版](README_cn.md)**

</div>

## 📖 Overview

ClarityFlow is a task clarification system that helps teams define goals, establish success criteria, and identify risks before execution. Through a standardized workflow (Clarify → Confirm → Execute → Complete), it reduces communication costs and improves delivery quality.

### 🎯 Core Values

- **Task Clarification** - Define "what" and "why" before starting work
- **Success Criteria** - Quantify completion standards with Definition of Done (DoD)
- **Risk Identification** - Anticipate factors that may impact delivery
- **Scope Boundaries** - Clearly define what's out of scope to prevent creep

## ✨ Features

### 📋 Kanban-style Task Management
- **Four-stage Workflow**: Needs Clarification → Confirmed → In Progress → Done
- **Drag-friendly**: Trello-like kanban layout (mobile-friendly with horizontal scroll)
- **Status Visualization**: Color-coded status badges and card borders

### 📝 Task Documentation
- **Structured Fields**:
  - Background & Problem
  - Definition of Done (Success Criteria)
  - Out of Scope (Boundaries)
  - Stakeholders
  - Risks
  - Due Date
- **Required Field Protection**: System validates core field completeness when transitioning to CONFIRMED status
- **Read-only Protection**: Completed tasks automatically lock fields

### 🔄 State Transitions
- **One-way Flow**: NEEDS_CLARIFICATION → CONFIRMED → IN_PROGRESS → DONE
- **Optimistic Locking**: Version-based concurrency control prevents override conflicts
- **Field Integrity Validation**: I5 invariant ensures CONFIRMED+ tasks contain all core fields

### 📤 Markdown Export
- One-click export of task documents to Markdown format
- Includes complete context, risks, and boundary information
- Supports copying to documentation systems (Notion, Confluence, etc.)

### 🎨 Modern UI
- **Modern SaaS Style**: Design language inspired by Linear/Notion
- **Responsive Layout**: Perfect support for desktop and mobile devices
- **Immersive Editing**: Document-style detail pages for focused content creation

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express + TypeScript
- **Database**: SQLite + Prisma ORM
- **Validation**: Zod
- **Testing**: Jest

### Frontend
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

## 📦 Installation & Usage

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Git** (optional, for cloning)

### Local Development

#### 1. Clone Repository

```bash
git clone https://github.com/openvino-book/ClarityFlow.git
cd ClarityFlow
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Initialize Database

```bash
npx prisma migrate dev
```

#### 4. Start Development Server

```bash
# Start both API and Web
npm run dev

# Or start separately
npm run dev:api  # API runs at http://localhost:3000
npm run dev:web  # Web runs at http://localhost:5173
```

#### 5. Access Application

Open browser at: **http://localhost:5173**

### Docker Deployment (Recommended for Production)

#### Using Docker Compose (Recommended)

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

#### Using Docker Commands

```bash
# Build image
docker build -t clarityflow .

# Run container
docker run -d \
  -p 8080:3000 \
  -v ./prisma/dev.db:/app/prisma/dev.db \
  --name clarityflow \
  clarityflow

# View logs
docker logs -f clarityflow

# Stop and remove container
docker stop clarityflow
docker rm clarityflow
```

#### Access Production Application

After startup, access at: **http://localhost:8080**

## 📚 Usage Guide

### Create a Task

1. Click **"New Card"** button in the top right
2. Enter task title (required)
3. Click **"Create"** to enter detail page

### Edit Task Documentation

1. Click any task card on the kanban board
2. Edit the following fields:
   - **Background & Problem** - Detailed task background and current issues (required for status transition)
   - **Success Criteria** - Define acceptance criteria (required for status transition)
   - **Out of Scope** - Explicitly exclude content (optional)
   - **Stakeholders** - Teams or individuals involved (optional)
   - **Risks** - Factors that may impact delivery (optional)
   - **Due Date** - Task deadline (optional)
3. Click **"Save Changes"**

### Advance Task Status

In the top right of task detail page:
- **Confirm Task** (Needs Clarification → Confirmed) - Ensure core fields are filled
- **Start Execution** (Confirmed → In Progress) - Mark task as in development
- **Mark Complete** (In Progress → Done) - Lock fields after task completion

### Export Task Documentation

1. Open task detail page
2. Click **"Export"** button in top right
3. Copy Markdown content from popup
4. Paste into documentation system (Notion, Confluence, etc.)

## 🏗️ Project Structure

```
ClarityFlow/
├── apps/
│   ├── api/              # Express API Backend
│   │   ├── src/
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Business logic
│   │   │   ├── middleware/# Middleware
│   │   │   └── app.ts    # Express app
│   │   └── prisma/       # Prisma schema
│   └── web/              # React Frontend
│       ├── src/
│       │   ├── components/
│       │   │   └── ui/   # UI component library
│       │   ├── pages/    # Page components
│       │   └── lib/      # Utility functions
│       └── index.html
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database (dev)
├── Dockerfile            # Multi-stage Docker config
├── docker-compose.yml    # Docker Compose config
└── README.md             # This file
```

## 🔧 Development Guide

### Run Tests

```bash
# Run all tests
npm test

# Run only API tests
npm run test:api
```

### Code Linting

```bash
# Run ESLint
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name <migration-name>

# Reset database (dev environment)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### Build

```bash
# Build all apps
npm run build

# Build only API
npm run build -w apps/api

# Build only Web
npm run build -w apps/web
```

## 🏛️ System Architecture

### Data Model

**Card (Task Card)**
- `id`: UUID (primary key, immutable)
- `version`: Version number (optimistic lock)
- `status`: State machine (NEEDS_CLARIFICATION | CONFIRMED | IN_PROGRESS | DONE)
- `problem`, `successCriteria`, `outOfScope`, `stakeholders`, `risks`: Business fields
- `createdAt`, `updatedAt`: Timestamps
- `deletedAt`: Soft delete marker

### System Invariants

1. **I1. Identity Constancy**: Card IDs are immutable
2. **I2. Time Flow**: createdAt ≤ updatedAt always
3. **I3. Ghost Defense**: Soft-deleted items filtered from standard queries by default
4. **I4. State Machine**: One-way state transitions (irreversible)
5. **I5. Continuous Integrity**: CONFIRMED+ status must contain core fields
6. **I6. Export Completeness**: Exports must include context, risks, boundaries
7. **I7. Concurrency Protection**: All updates must check version number

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cards` | Get all tasks |
| GET | `/api/cards/:id` | Get task details |
| POST | `/api/cards` | Create task |
| PATCH | `/api/cards/:id` | Update task (optimistic lock) |
| POST | `/api/cards/:id/transition` | State transition |
| GET | `/api/cards/:id/export` | Export Markdown |
| DELETE | `/api/cards/:id` | Soft delete task |
| GET | `/health` | Health check |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Prisma](https://www.prisma.io) - Modern ORM
- [Vite](https://vitejs.dev) - Next-gen frontend build tool
- [TanStack Query](https://tanstack.com/query) - Powerful data synchronization library

---

**Built with ❤️ for productive teams**
