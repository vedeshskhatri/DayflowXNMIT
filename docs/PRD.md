# Dayflow — Product Requirements Document

**Odoo x NMIT Hackathon**
*"Every workday, perfectly aligned."*

---

## 1. Purpose

Dayflow digitizes core HR operations: employee onboarding, profile management, attendance tracking, leave management, payroll visibility, and admin/HR approval workflows — built as a locally-hosted, self-contained system (no BaaS, no cloud dependency), per Odoo's constraints.

## 2. Scope

- Secure authentication (Admin/HR-created accounts, not open self-registration)
- Role-based access: Admin, HR Officer, Employee
- Employee profile management (view/edit, tabbed: About / Private Info / Salary Info)
- Attendance tracking with live check-in/check-out
- Leave and time-off management with approval workflow
- Payroll/salary visibility (Admin-controlled)
- **Real-time updates across all of the above** — this is Dayflow's differentiator vs. Odoo's native HR app

## 3. User Roles

| Role | Access |
|---|---|
| **Admin** | Full access: create/edit all employees, view/edit all salary info, approve/reject all time-off, view all attendance |
| **HR Officer** | Same operational access as Admin (approvals, attendance visibility) — no distinction made at UI level unless time allows |
| **Employee** | View/edit own profile (limited fields), view own attendance, apply for time-off, view own salary (read-only) |

## 4. Functional Requirements

### 4.1 Authentication
- Admin/HR creates new employee → system auto-generates Login ID (see `SCHEMA.md` for exact format) and a temporary password
- Employee logs in with Login ID/Email + password, forced to change password on first login
- Incorrect credentials show a clear inline error
- Successful login redirects to the Employees dashboard (card grid)

### 4.2 Dashboard (Employee Cards)
- Grid of clickable employee cards, each showing photo + name + live presence status dot (present / on leave / absent)
- Clicking a card → that employee's profile in **view-only** mode
- Clicking your own avatar (top right) → dropdown: My Profile (opens your own profile in **editable** form), Log Out
- Check In / Check Out control visible on this page; successful check-in flips your own status dot live

### 4.3 Employee Profile
- Tabs: **About** (bio, "what I love about my job," interests, skills, certifications — all editable by the employee), **Private Info** (DOB, address, personal email, gender, marital status, date of joining), **Salary Info** (Admin-only visibility)
- Employees can edit limited fields (address, phone, profile picture); Admin can edit all fields for any employee

### 4.4 Attendance
- Daily/weekly views
- Employee: sees own attendance only, plus summary stats (days present, leaves taken, total working days)
- Admin/HR: sees all employees' attendance for the current day/week, with date navigation and search
- Attendance records are the basis for payroll — unpaid leave or unaccounted absence reduces payable days at payroll computation

### 4.5 Time-Off
- Employee: applies for leave (type: Paid / Sick / Unpaid, date range, remarks; attachment required for Sick), views own request history and current balances
- Admin/HR: views all requests, approves/rejects with the change reflected immediately (and live, via socket push) to the employee
- Allocation view: per-employee balance per leave type

### 4.6 Salary/Payroll
- Employee: read-only view of own salary structure
- Admin: sets wage, salary components (fixed amount or % of wage), PF %, working days/week — components auto-recalculate against wage on save, and must not exceed the defined wage in total

## 5. Must-Have Acceptance Criteria (Odoo judging criteria — non-negotiable)

- [ ] All data is real and dynamic — served from PostgreSQL via the self-built API, no static JSON in the shipped build
- [ ] UI is responsive (mobile + desktop) with one consistent color scheme/spacing system throughout
- [ ] Every form validates input robustly, both client- and server-side, with visible error states
- [ ] Navigation is consistent and intuitive across every screen (same nav bar position/structure)
- [ ] Git history shows real, distributed contributions from all three team members — not one owner committing everything

## 6. Nice-to-Have

- Self-designed schema and self-built API (already required by Odoo's rules, so this is baseline, not optional)
- Team understands and can explain any AI-generated code, not blind copy-paste
- Fully offline/local (Docker Compose), no dependency on internet connectivity during the demo
- Real-time (Socket.IO) used because it adds genuine UX value — not bolted on for novelty

## 7. Out of Scope (v1)

- Email verification on account creation
- Self-service open registration (accounts are always Admin/HR-created)
- Half-day attendance status logic
- Automated payroll run/salary slip generation and export
- Analytics/reporting dashboards
- PF/professional tax edge-case formulas beyond simple percentage config
