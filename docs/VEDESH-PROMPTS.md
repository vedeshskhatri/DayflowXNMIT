# Vedesh — Repo Owner: Auth, Architecture, Sockets

Repo: https://github.com/vedeshskhatri/DayflowXNMIT.git

Read `docs/PRD.md`, `docs/TECH-STACK.md`, `docs/SCHEMA.md`, `docs/RULES.md` before opening Antigravity. Place `AGENTS.md` (from `RULES.md` section 4) at the repo root first — Antigravity/Ponytail picks it up automatically for every prompt below.

---

## Setup tasks (do before any prompts)

1. Create repo, push initial structure (see `GIT-WORKFLOW.md` §1)
2. Add Aryan and Swapnil as collaborators
3. Push `AGENTS.md`, `docker-compose.yml`, empty `/backend` and `/frontend` skeletons

---

## Prompt 1 — Docker + base backend skeleton

```
Set up a Docker Compose stack for a project called Dayflow with three services: db (Postgres 16), backend (Node + Express + TypeScript), and frontend (React + Vite). Use the folder structure and stack described in docs/TECH-STACK.md exactly. Backend should have a working Express server on port 4000 with a health check route at /health. Include a Dockerfile for backend and frontend. Do not add any services or packages beyond what's in docs/TECH-STACK.md.
```

## Prompt 2 — Prisma schema + migration

```
Using the exact Prisma schema in docs/SCHEMA.md, set up Prisma in the backend, create the schema.prisma file, and run the initial migration against the local Postgres container. Then write a seed script (prisma/seed.ts) that creates one Company with code "DX", one Admin employee, and 6 sample Employee records with a mix of PRESENT, ON_LEAVE, and ABSENT status, following the Login ID format described in docs/SCHEMA.md. Also seed the three TimeOffTypes (Paid Time Off, Sick Leave, Unpaid Leave) with allocations for each employee.
```

## Prompt 3 — Login ID generator + auth

```
Implement the auth module in backend/src/modules/auth per docs/RULES.md and docs/APP-FLOW.md. Include:
1. A Login ID generator function following the exact format in docs/SCHEMA.md: [company code][first 2 letters of first name][first 2 letters of last name][year of joining][4-digit serial number for that joining year]. Serial number must increment correctly per company per year.
2. POST /auth/employees — Admin/HR-only route to create a new employee (auto-generates Login ID and a temporary password, sets mustResetPwd: true).
3. POST /auth/login — validates Login ID/email + password with bcrypt, returns a JWT.
4. POST /auth/reset-password — forces password change when mustResetPwd is true.
5. Auth middleware that verifies the JWT and attaches the employee + role to the request.
Validate all inputs with Zod per docs/RULES.md. Do not build email verification — that's explicitly out of scope.
```

## Prompt 4 — Socket.IO server setup

```
Set up a Socket.IO server in backend/src/sockets, integrated with the Express app. Use company-scoped rooms (company:{companyId}) so events only broadcast within a company. Implement a connection handler that joins the authenticated employee's socket to their company room using the JWT from auth middleware. Export a helper function emitToCompany(companyId, event, payload) that other modules (attendance, timeoff) can call to broadcast events. Follow the event names exactly as listed in docs/APP-FLOW.md section 6: attendance:checkin, attendance:checkout, presence:update, timeoff:requested, timeoff:statusChanged.
```

## Prompt 5 — Frontend auth + socket client setup

```
Set up the frontend React app with Vite, Tailwind configured per docs/DESIGN-SYSTEM.md's color palette and typography (Space Grotesk headings, Inter body), and React Router. Build the Sign In page and the forced password-reset flow per docs/APP-FLOW.md section 1. Set up a socket.io-client connection in src/lib/socket.ts that connects after login using the JWT, and a React Query client in src/lib/api.ts. Use the exact color tokens from docs/DESIGN-SYSTEM.md in the Tailwind config — no ad-hoc hex values.
```

## Integration checkpoint reminder

Once prompts 1-5 are working and merged to `main`, tell Aryan and Swapnil — they branch off `main` from this point for their own modules. Don't let them start building against a moving target.
