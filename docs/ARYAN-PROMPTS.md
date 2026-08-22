# Aryan — Profile & Attendance

Repo: https://github.com/vedeshskhatri/DayflowXNMIT.git

Before starting: pull `main` after Vedesh has merged auth + Prisma schema + Socket.IO setup. Read `docs/PRD.md` §4.2–4.4, `docs/APP-FLOW.md` §2–4, `docs/DESIGN-SYSTEM.md`, and `docs/RULES.md`. Your `AGENTS.md` is already at repo root — Antigravity reads it automatically.

```bash
git checkout main
git pull origin main
git checkout -b feat/profile
```

---

## Prompt 1 — Employee list + dashboard cards (backend + frontend)

```
Build the Employees dashboard per docs/APP-FLOW.md section 2. Backend: GET /employees route (Admin/HR sees all, employees see all but view-only for others) returning employee list with live status field. Frontend: a responsive card grid page (per docs/DESIGN-SYSTEM.md breakpoints: 1 col mobile, 2 col md, 3 col lg) where each card shows profile picture, name, and a status dot using the exact colors from docs/DESIGN-SYSTEM.md (sage green filled = present, deep sage half-filled = on leave, terracotta = absent). Cards are clickable, navigating to /employees/:id. Subscribe to the presence:update socket event so status dots update live without refresh.
```

## Prompt 2 — Employee profile view/edit (backend + frontend)

```
Build the Employee Profile module per docs/APP-FLOW.md section 3 and docs/SCHEMA.md. Backend: GET /employees/:id and PATCH /employees/:id, with field-level permission logic — employees can only PATCH address, phone, profilePicUrl, bio, jobLove, interests, skills, and certifications on their own record; Admin can PATCH any field on any employee. Frontend: a tabbed profile page (About / Private Info / Salary Info) per docs/DESIGN-SYSTEM.md styling. When viewing your own profile (/profile route), render in editable form mode with React Hook Form + Zod validation. When viewing another employee's card (/employees/:id), render fully read-only. The Salary Info tab must only be visible/fetched when the viewer is Admin — never shown on an employee's own profile view, even to themselves.
```

## Prompt 3 — Attendance: check-in/check-out (backend + frontend)

```
Build the attendance check-in/check-out flow per docs/APP-FLOW.md and docs/RULES.md section 1. Backend: POST /attendance/checkin and POST /attendance/checkout. Enforce: cannot check in twice without checking out, cannot check out without a prior check-in that day, checkout time must be after checkin time. On success, emit attendance:checkin / attendance:checkout and presence:update via the socket helper from backend/src/sockets. Frontend: Check In / Check Out buttons on the Employees dashboard page, showing the correct button based on today's attendance state, with the status dot updating live and locally without a page refresh on success.
```

## Prompt 4 — Attendance list views (backend + frontend)

```
Build the attendance list views per docs/APP-FLOW.md section 4. Backend: GET /attendance (employee's own records, paginated by week) and GET /attendance/all (Admin/HR only, all employees, filterable by date, with a search param for employee name). Frontend: two views per docs/DESIGN-SYSTEM.md — employee view shows own weekly attendance table plus summary stats (days present, leaves taken, total working days); Admin/HR view shows all employees for the selected date with a search bar and prev/next date navigation. Both subscribe to attendance:checkin/checkout socket events so rows update live. On mobile (below md breakpoint), switch the table to a stacked card layout per docs/DESIGN-SYSTEM.md section 6 — do not allow horizontal scroll.
```

## Push and PR

```bash
git add .
git commit -m "feat(profile): employee dashboard, profile view/edit"
git push origin feat/profile
# open PR into main
```
Repeat commit/push per prompt as you go — small real commits, not one giant dump at the end.
