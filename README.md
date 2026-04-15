# TaskFlow

**A modern, full-stack SaaS project management dashboard** built with React, FastAPI, and PostgreSQL. Designed for teams that value craft, speed, and clean architecture.

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.12-blue)
![React](https://img.shields.io/badge/react-18-blue)
![FastAPI](https://img.shields.io/badge/fastapi-0.115-green)

---

## Features

- **Dashboard Analytics** — Real-time overview of projects, task completion rates, overdue items, and activity feed
- **Kanban Board** — Drag-and-drop task management with 5 status columns (Backlog → Done)
- **Project Management** — Create, color-code, and track projects with progress bars
- **Task System** — Full CRUD with priority levels (Low/Medium/High/Urgent), due dates, and descriptions
- **JWT Authentication** — Secure registration, login, token refresh, and protected routes
- **Responsive Design** — Collapsible sidebar, mobile-friendly layout
- **Polished UI** — Custom design system with DM Sans + Source Sans 3 typography, refined animations, and a cohesive color palette

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                        │
│  React 18 + TypeScript + Vite + TailwindCSS                     │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐  │
│  │ Zustand  │ │  React   │ │  Axios   │ │  React Router v6    │  │
│  │ (Auth)   │ │  Query   │ │ (HTTP)   │ │  (Client Routing)   │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────────────────────┘  │
│       └─────────────┼───────────┘                                │
└─────────────────────┼───────────────────────────────────────────┘
                      │ HTTPS / JSON
┌─────────────────────┼───────────────────────────────────────────┐
│                  BACKEND (Railway)                               │
│  FastAPI + Python 3.12 + SQLAlchemy 2.0 (async)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐  │
│  │  Auth    │ │ Projects │ │  Tasks   │ │  Dashboard          │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Analytics          │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬──────────────┘  │
│       └─────────────┼───────────┼───────────────┘                │
│                     │    SQLAlchemy ORM                           │
└─────────────────────┼───────────────────────────────────────────┘
                      │ asyncpg
┌─────────────────────┼───────────────────────────────────────────┐
│              PostgreSQL 16 (Railway Add-on)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│  │  users   │ │ projects │ │  tasks   │                         │
│  └──────────┘ └──────────┘ └──────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model

```
users (1) ──── (N) projects (1) ──── (N) tasks
  │                                        │
  └────────── assignee (0..1) ─────────────┘
```

---

## Tech Decisions

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | React 18 + Vite | Fastest DX; HMR < 50ms; tree-shaking |
| **Styling** | TailwindCSS | Utility-first = consistent design at speed |
| **State** | Zustand (auth) + React Query (server) | Clean separation; RQ handles caching/revalidation |
| **Routing** | React Router v6 | Nested layouts, protected routes out of the box |
| **Backend** | FastAPI | Async-native, auto OpenAPI docs, Pydantic validation |
| **ORM** | SQLAlchemy 2.0 async | Type-safe queries, async sessions, migration support |
| **Auth** | JWT (access + refresh) | Stateless, works across microservices |
| **Database** | PostgreSQL 16 | ACID-compliant, UUID support, production-grade |
| **Migrations** | Alembic | Industry standard for SQLAlchemy |
| **Testing** | pytest + Vitest | Async test support; React Testing Library for UI |
| **CI/CD** | GitHub Actions | Matrix testing → auto-deploy on main |
| **Deploy** | Vercel (FE) + Railway (BE) | Zero-config, Git-based, free tiers available |

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### Quick Start with Docker

```bash
# Clone the repo
git clone https://github.com/yourusername/taskflow.git
cd taskflow

# Start everything
docker compose up -d

# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/api/docs
```

### Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start dev server
npm run dev
```

---

## Deployment

### Backend → Railway

1. Create a [Railway](https://railway.app) account
2. New Project → Deploy from GitHub Repo
3. Add a PostgreSQL plugin
4. Set environment variables:

```
DATABASE_URL=<auto-populated by Railway>
SECRET_KEY=<generate a strong random string>
CORS_ORIGINS=https://your-frontend.vercel.app
ENVIRONMENT=production
```

5. Railway auto-detects the Dockerfile and deploys

### Frontend → Vercel

1. Create a [Vercel](https://vercel.com) account
2. Import your GitHub repository
3. Set the root directory to `frontend`
4. Set environment variables:

```
VITE_API_URL=https://your-backend.railway.app
```

5. Update `vercel.json` with your Railway backend URL
6. Deploy — Vercel auto-builds on push

### CI/CD Secrets

Add these to GitHub → Settings → Secrets:

| Secret | Source |
|--------|--------|
| `RAILWAY_TOKEN` | Railway dashboard → Account → Tokens |
| `VERCEL_TOKEN` | Vercel dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |

---

## API Reference

All endpoints are documented at `/api/docs` (Swagger UI) and `/api/redoc`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/me` | Update profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PATCH | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?project_id=` | List tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/reorder` | Reorder task |
| POST | `/api/tasks/bulk-update` | Bulk update |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get analytics |

---

## Testing

```bash
# Backend
cd backend
pip install aiosqlite  # SQLite driver for tests
python -m pytest app/tests/ -v

# Frontend
cd frontend
npm run test
```

---

## Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # Auth, Projects, Tasks, Dashboard endpoints
│   │   ├── core/            # Config, Database, Security
│   │   ├── models/          # SQLAlchemy models (User, Project, Task)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── tests/           # Integration tests
│   │   └── main.py          # FastAPI app entry
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, UI components
│   │   ├── hooks/           # React Query hooks
│   │   ├── lib/             # API client, Zustand store
│   │   ├── pages/           # Dashboard, Projects, Login, Register
│   │   ├── styles/          # Global CSS + Tailwind
│   │   ├── types/           # TypeScript interfaces
│   │   └── tests/           # Frontend tests
│   ├── Dockerfile
│   └── package.json
├── .github/workflows/       # CI/CD pipeline
├── docker-compose.yml       # Local development
├── railway.toml             # Railway deployment config
└── README.md
```

---

## Recording Your Demo Video

Here's a script for a strong 2-minute portfolio demo:

**0:00 – 0:15** — Intro: "This is TaskFlow, a full-stack SaaS project management tool I built with React, FastAPI, and PostgreSQL."

**0:15 – 0:40** — Show the login/register flow. Register a new user. Highlight the polished UI, custom fonts, and animations.

**0:40 – 1:10** — Create a project, add 4-5 tasks with different priorities and statuses. Show the Kanban board populating in real-time. Click into a task, change its status and priority.

**1:10 – 1:30** — Navigate to the Dashboard. Walk through the analytics: completion rate, tasks by status/priority charts, recent activity feed.

**1:30 – 1:50** — Quick tour of the code: show the backend architecture (models → schemas → routes), the React Query hooks, and one test file. Mention the async SQLAlchemy setup.

**1:50 – 2:00** — Wrap up: "Deployed on Vercel and Railway with CI/CD via GitHub Actions. Full test suite. Check out the repo at [link]."

**Recording tips:** Use [OBS Studio](https://obsproject.com/) or [Loom](https://www.loom.com/). Record at 1080p. Use a clean browser profile (no bookmarks bar). Zoom your browser to 110% for readability.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built with care by [Your Name](https://github.com/yourusername)
