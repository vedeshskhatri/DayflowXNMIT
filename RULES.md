# Dayflow — Rules & Validation

## 1. Validation Rules (implement in Zod on backend, mirror in React Hook Form on frontend)

### Auth
- Email: valid format, unique
- Password (on creation/reset): min 8 chars, at least 1 number, at least 1 uppercase
- Login ID: server-generated only, never accepted from client input

### Employee Profile
- Phone: numeric, 10 digits (adjust to locale if needed)
- Date of Birth: must be in the past, employee must be ≥ 18 at date of joining
- Date of Joining: required, cannot be in the future

### Attendance
- Check-out time must be after check-in time on the same record
- Cannot check in twice without checking out first
- Cannot check out without a prior check-in that day

### Time-Off
- `endDate` must be ≥ `startDate`
- Requested days cannot exceed remaining allocation for that type
- Sick Leave requires an attachment before submit is enabled (disable submit button client-side, re-validate server-side)
- Cannot submit overlapping requests with an existing PENDING or APPROVED request

### Salary Info (Admin only)
- `monthlyWage` must be > 0
- Sum of all component `computedAmount` must not exceed `monthlyWage` — reject save with a clear error, don't silently clamp
- PF % and Professional Tax must be ≥ 0

## 2. Business Rules

- Only Admin/HR can create employee accounts — no public self-registration route exists
- Salary Info tab is visible only to Admin viewing any employee, and never to the employee viewing their own profile
- Employee can edit only: address, phone, profile picture, About-tab content (bio, interests, skills, certifications)
- Admin can edit all fields for any employee
- Attendance-derived payable days: unpaid leave or unaccounted absence reduces payable days at payroll computation (logic can be a simple derived calculation, doesn't need a full payroll run feature)
- Time-off approval/rejection is immediate and irreversible in-app (no "undo" needed for v1)

## 3. Must-Have Compliance Checklist (verify before submission)

- [ ] No static JSON powering any production screen — everything hits the real API/DB
- [ ] Every screen uses the palette and spacing from `DESIGN-SYSTEM.md` consistently
- [ ] Every form has visible client-side validation errors AND server-side rejection of bad payloads
- [ ] Nav bar identical across all pages, responsive down to mobile
- [ ] Git log shows commits from all three GitHub accounts, on feature branches, merged via PRs

## 4. AGENTS.md (place this exact content at repo root — Antigravity/Ponytail reads it automatically)

```markdown
# Dayflow HRMS — Agent Instructions

## Stack (fixed, do not suggest alternatives)
Node/Express + TypeScript, PostgreSQL, Prisma, React + Vite + Tailwind, Socket.IO, Zod, React Hook Form, React Query, Docker Compose.

## Do NOT build
- Email verification flow
- Public self-registration (accounts are Admin/HR-created only)
- Half-day attendance status logic
- Automated payroll run / salary slip PDF export
- Analytics/reporting dashboards
- PF/tax edge-case formulas beyond simple percentage config

## Must enforce
- Every attendance/time-off state change that another user's screen depends on MUST emit a Socket.IO event. This is the core differentiator — never skip it to save time.
- All API routes that accept a body MUST validate with Zod and return clear 400 errors on failure.
- Salary components: FIXED or PERCENTAGE, computed server-side on save (not live per keystroke), sum must not exceed monthlyWage.
- Use the exact color palette and spacing scale in docs/DESIGN-SYSTEM.md — no ad-hoc hex values in components.
- Every commit should be small and real — no single giant "final commit" dumps.

## When generating code
- Prefer explicit, readable code over cleverness — this needs to be explainable to judges by whoever built it.
- Do not introduce new npm packages outside the locked stack without flagging it first.
- Flag any scope creep immediately instead of silently implementing extra features.
```
