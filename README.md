# Pino Blog

A full-stack blog platform with AI-powered features, built as a pnpm monorepo.

**Live:** [blog-app.pinodev.app](https://blog-app.pinodev.app) · **API:** [blog-api.pinodev.app](https://blog-api.pinodev.app)

---

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS · TypeORM · PostgreSQL |
| Frontend | Next.js 15 (App Router) · Tailwind CSS v4 |
| Auth | JWT (httpOnly cookies) · bcrypt · refresh tokens |
| AI | Google Gemini — summaries & category suggestions |
| Search | PostgreSQL full-text search (`tsvector` + GIN index) |
| Infra | Docker Compose · pnpm workspaces |

---

## Features

- **Public blog** — paginated post feed with inline debounced search
- **Markdown rendering** — posts written and rendered as Markdown
- **AI summaries** — Gemini generates a summary on publish
- **AI category suggestions** — Gemini suggests relevant categories based on content
- **Cookie-based auth** — httpOnly JWT access token + rotating refresh tokens
- **Role-based access** — `admin` and `writer` roles
- **Admin panel** — full CRUD for posts and categories
- **Draft system** — posts start as drafts, published explicitly

---

## Project Structure

```
/
├── apps/
│   ├── backend/          # NestJS API  (@blog/backend)
│   └── frontend/         # Next.js app (@blog/frontend)
├── packages/
│   └── types/            # Shared TypeScript interfaces (@blog/types)
├── scripts/
│   └── seed.sh           # Database seeder (30 posts, 5 users, 10 categories)
├── docker-compose.yml    # PostgreSQL + PgAdmin
└── .env                  # Environment variables (monorepo root)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker

### 1. Clone and install

```bash
git clone https://github.com/MonkeyDPino/blog-app.git
cd blog-app
pnpm install
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Configure environment

Create a `.env` file at the monorepo root:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=my_blog_db
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=blog_password

# Backend
PORT=3000
JWT_SECRET=your_jwt_secret
JWT_ISSUER=blog-api
JWT_AUDIENCE=blog-app

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# CORS
FRONTEND_URL=http://localhost:3001
```

### 4. Run migrations

```bash
cd apps/backend
pnpm migration:run
```

### 5. Seed the database

```bash
./scripts/seed.sh --reset
```

### 6. Start development servers

```bash
# From monorepo root
pnpm dev
```

Backend runs on `http://localhost:3000` · Frontend on `http://localhost:3001`

---

## Commands

```bash
# Development
pnpm dev                  # Start backend in watch mode
pnpm lint                 # ESLint with autofix (all workspaces)
pnpm format               # Prettier (all workspaces)

# Testing
pnpm test                 # Unit tests
pnpm test:e2e             # E2E tests (requires running DB)

# Database
pnpm migration:generate   # Generate migration from entity changes
pnpm migration:run        # Apply pending migrations
pnpm migration:show       # List migration status

# Seed
./scripts/seed.sh         # Idempotent seed (ON CONFLICT DO NOTHING)
./scripts/seed.sh --reset # Truncate tables and re-seed
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | — | Login, sets httpOnly cookies |
| `POST` | `/auth/refresh` | cookie | Rotate access + refresh tokens |
| `POST` | `/auth/logout` | JWT | Revoke refresh token |
| `GET` | `/auth/me` | JWT | Current user |
| `GET` | `/posts` | — | Paginated post feed |
| `GET` | `/posts/search?q=` | — | Full-text search |
| `POST` | `/posts` | JWT | Create draft |
| `POST` | `/posts/:id/publish` | JWT | Publish + generate AI summary |
| `POST` | `/posts/:id/suggest-categories` | JWT | AI category suggestions |
| `GET` | `/categories` | — | All categories |
| `GET` | `/users/:id/posts` | JWT | Posts by user |

Full interactive docs (dev only): `http://localhost:3000/docs`

---

## Auth Flow

```
Login → backend sets access_token (httpOnly, 6h) on API domain
                    + refresh_token_id / refresh_token_value (httpOnly, 7d)
      → frontend sets session_active (1h) on its own domain for middleware

Expired access token → client calls /auth/refresh automatically
Failed refresh → auth:expired event → session cleared
```

The Next.js middleware reads `session_active` (a non-sensitive flag cookie on the frontend domain) since the real JWT lives on the API domain and is inaccessible server-side from the frontend.

---

## License

MIT
