# Swapnil — Time-Off & Payroll

Repo: https://github.com/vedeshskhatri/DayflowXNMIT.git

Before starting: pull `main` after Vedesh has merged auth + Prisma schema + Socket.IO setup. Read `docs/PRD.md` §4.5–4.6, `docs/APP-FLOW.md` §5, `docs/DESIGN-SYSTEM.md`, and `docs/RULES.md`. Your `AGENTS.md` is already at repo root — Antigravity reads it automatically.

```bash
git checkout main
git pull origin main
git checkout -b feat/timeoff
```

---

## Prompt 1 — Time-off request flow (backend + frontend, employee side)

```
Build the employee-side time-off request flow per docs/APP-FLOW.md section 5 and docs/RULES.md section 1. Backend: POST /timeoff/requests, validated with Zod — endDate >= startDate, requested days cannot exceed remaining TimeOffAllocation for that type, attachment required if the TimeOffType.requiresProof is true (Sick Leave), and reject overlapping requests against existing PENDING or APPROVED requests for that employee. Use Multer for the attachment upload, stored locally under backend/uploads. On success emit timeoff:requested via the socket helper. Frontend: a Time Off page per docs/DESIGN-SYSTEM.md showing balances (Paid Time Off / Sick Leave days available) at the top, a calendar date picker, and a "New Request" modal with Time Off Type dropdown, date range, remarks, and a conditional attachment upload field that's required (and disables Submit until provided) when Sick Leave is selected.
```

## Prompt 2 — Time-off approval flow (backend + frontend, admin side)

```
Build the Admin/HR time-off approval flow per docs/APP-FLOW.md section 5. Backend: GET /timeoff/requests (Admin/HR only, all employees) and PATCH /timeoff/requests/:id to approve or reject, which also decrements the employee's TimeOffAllocation.daysUsed on approval. On status change, emit timeoff:statusChanged scoped so only the requesting employee's client reacts to it. Frontend: an Admin/HR Time Off view per docs/DESIGN-SYSTEM.md with two tabs — "Time Off" (table: Name, Start Date, End Date, Type, Status badge using the status colors in docs/DESIGN-SYSTEM.md, Approve/Reject buttons) and "Allocation" (per-employee balance table). The employee's own Time Off page should subscribe to timeoff:statusChanged and update the request's status live with a toast notification, no refresh needed.
```

## Prompt 3 — Salary/Payroll module (backend + frontend)

```
Build the Salary Info module per docs/SCHEMA.md and docs/APP-FLOW.md section 3. Backend: GET /employees/:id/salary (Admin sees full editable structure for any employee; employee sees own salary read-only; both blocked from seeing anyone else's read-only view except Admin) and PATCH /employees/:id/salary (Admin only). Implement the calculation rule from docs/SCHEMA.md exactly: components resolve as FIXED amount or PERCENTAGE (of wage or of Basic where specified), recompute all computedAmount values server-side whenever monthlyWage changes, and reject the save with a clear error if the sum of all components exceeds monthlyWage. Frontend: the Salary Info tab (only rendered for Admin viewing any profile, per docs/DESIGN-SYSTEM.md styling) with Monthly/Yearly Wage fields, a components list (add/edit component: name, type, value), PF % and working days/week fields, and clear inline validation errors if the sum exceeds wage.
```

## Prompt 4 — Attendance-based payable days (simple derived calc)

```
Add a simple derived calculation, not a full payroll run: given an employee's attendance records and approved unpaid-leave time-off requests for a date range, compute payable days = total working days in range minus unpaid-leave days minus unaccounted absences. Expose this as GET /employees/:id/payable-days?from=&to=, used for a small read-only summary shown on the Admin's Salary Info tab. No PDF export, no salary slip generation — that's out of scope per docs/PRD.md.
```

## Push and PR

```bash
git add .
git commit -m "feat(timeoff): employee request flow with attachment validation"
git push origin feat/timeoff
# open PR into main
# then branch feat/payroll for prompts 3-4
```
Small real commits per prompt, not one giant dump at the end.
