# Task Management App

A full-stack task management application built with **Go**, **Next.js**, and **PostgreSQL**.

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Go · Gin · sqlc · pgx · golang-migrate          |
| Frontend  | Next.js 14 (App Router) · TypeScript · Tailwind |
| State     | TanStack Query · Zustand                        |
| Database  | PostgreSQL 16                                   |
| Auth      | JWT (golang-jwt) · bcrypt                       |
| Infra     | Docker · Docker Compose                         |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- **Or** locally: Go 1.22+, Node.js 20+, PostgreSQL 16

## Quick Start (Docker)

```bash
cp .env.example .env          # copy env vars
docker compose up --build     # start all services
```

Services:
- Frontend → http://localhost:3000
- Backend API → http://localhost:8080
- PostgreSQL → localhost:5432

## Local Development

### Backend

```bash
cd backend
cp ../.env.example .env
go mod download
make migrate-up    # run DB migrations
make dev           # start with hot reload (air)
```

### Frontend

```bash
cd frontend
cp ../.env.example .env.local
npm install
npm run dev
```

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

## Project Structure

```
task-app/
├── backend/
│   ├── cmd/server/         # entrypoint
│   ├── internal/
│   │   ├── auth/           # JWT + password hashing
│   │   ├── handler/        # HTTP handlers
│   │   ├── middleware/     # auth, logger, CORS
│   │   ├── model/          # domain structs
│   │   ├── repository/     # sqlc-generated DB layer
│   │   └── service/        # business logic
│   ├── migrations/         # SQL migration files
│   └── sqlc/               # sqlc config + query files
└── frontend/
    ├── app/                # Next.js App Router
    ├── components/         # UI + feature components
    ├── lib/                # API client + hooks
    └── store/              # Zustand stores
```

## Running Tests

```bash
# Backend
cd backend && go test ./...

# Frontend
cd frontend && npm test
```

## Assumptions & Trade-offs

- SSE used for real-time updates over WebSockets — simpler server-side, sufficient for read-heavy task feeds
- sqlc over GORM — type-safe, no magic, explicit SQL
- URL search params own filter/sort/pagination state — shareable links, works with browser back/forward
- JWT stored in `localStorage` via Zustand persist — acceptable for this scope; swap to `httpOnly` cookies for stricter security requirements
