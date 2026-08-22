# Dayflow — Tech Stack

Locked. Do not deviate mid-build — if Antigravity/an AI agent suggests an alternative library or pattern, reject it unless it solves something this stack genuinely can't.

## Backend
- **Runtime:** Node.js
- **Framework:** Express + TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL 16 (local, containerized — never a hosted/cloud DB)
- **Validation:** Zod middleware on every route that accepts a body
- **Auth:** JWT (access token in httpOnly cookie or Authorization header — pick one and stay consistent), bcrypt for password hashing
- **Real-time:** Socket.IO server, rooms scoped per company (`company:{companyId}`)
- **File uploads:** Multer, local disk storage under `/backend/uploads` (mounted volume), used only for profile pictures and sick-leave attachments

## Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS, config driven by `DESIGN-SYSTEM.md` — no ad-hoc inline colors
- **Routing:** React Router
- **State/data fetching:** React Query (TanStack Query) for server state, so live socket updates and refetches stay in sync cleanly
- **Real-time client:** socket.io-client
- **Forms:** React Hook Form + Zod resolver (shared validation schemas with backend where possible)
- **Fonts:** Space Grotesk (headings) + Inter (body) — see `DESIGN-SYSTEM.md`

## Infra
- **Containerization:** Docker Compose — `db`, `backend`, `frontend` services, one command spin-up
- **Environment:** `.env` files per service, never committed (add to `.gitignore` day one), `.env.example` committed instead

## Dev tooling
- **IDE:** Antigravity (agent-first VS Code fork)
- **Agent guardrails:** Ponytail extension + root-level `AGENTS.md` (see `RULES.md`)
- **Version control:** Git, GitHub — see `GIT-WORKFLOW.md`

## Folder Structure

```
DayflowXNMIT/
├── docs/                        # this entire doc set
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   ├── attendance/
│   │   │   ├── timeoff/
│   │   │   └── payroll/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── validate.middleware.ts   # Zod wrapper
│   │   ├── sockets/
│   │   │   └── index.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── uploads/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── socket.ts
│   │   └── styles/
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── AGENTS.md
└── README.md
```

## Why this stack (for the pitch, if judges ask)
Self-built backend, self-designed relational schema, local Postgres — satisfies Odoo's explicit anti-BaaS constraint directly. Socket.IO is the one addition beyond a standard CRUD stack, and it's there because it does real work (live presence, live approvals), not because it's trendy.
