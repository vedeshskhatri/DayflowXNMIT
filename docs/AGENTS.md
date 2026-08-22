# Dayflow HRMS — Agent Instructions

## Stack (fixed, do not suggest alternatives)
Node/Express + TypeScript, PostgreSQL, Prisma, React + Vite + Tailwind, Socket.IO, Zod, React Hook Form, React Query, Docker Compose.

## Auth model (do not deviate)
JWT delivered via httpOnly cookie — never localStorage, never an Authorization header.
Socket.IO reads the JWT from the handshake's cookie header (see backend/src/sockets/index.ts) —
never use the `auth: { token }` client pattern, it can't work with an httpOnly cookie.
CORS must have `credentials: true` on both frontend and backend, origin explicitly set (never `*`).

## Do NOT build
- Email verification flow
- Public self-registration (accounts are Admin/HR-created only)
- Half-day attendance status logic
- Automated payroll run / salary slip PDF export
- Analytics/reporting dashboards
- PF/tax edge-case formulas beyond simple percentage config

## Must enforce
- Every attendance/time-off state change that another user's screen depends on MUST emit a Socket.IO event via emitToCompany(). This is the core differentiator — never skip it to save time.
- All API routes that accept a body MUST validate with the validate(schema) Zod middleware and return clear 400 errors with field-level detail on failure.
- Salary components: FIXED or PERCENTAGE, computed server-side on save (not live per keystroke), sum must not exceed monthlyWage.
- Use the exact color palette and spacing scale in docs/DESIGN-SYSTEM.md — no ad-hoc hex values in components.
- Every commit should be small and real — no single giant "final commit" dumps.
- Logout must call socket.disconnect() on the frontend before POST /auth/logout — otherwise a logged-out user's socket stays connected to the company room.

## When generating code
- Prefer explicit, readable code over cleverness — this needs to be explainable to judges by whoever built it.
- Do not introduce new npm packages outside the locked stack without flagging it first.
- Flag any scope creep immediately instead of silently implementing extra features.
