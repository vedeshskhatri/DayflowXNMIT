<p align="center">
  <img src="docs/assets/dayflow-banner.png" alt="Dayflow Banner" width="100%" />
</p>

<h1 align="center">Dayflow — HRMS</h1>

<p align="center">
  <em>"Every workday, perfectly aligned."</em>
</p>

<p align="center">
  <strong>A modern, real-time, self-hosted Human Resource Management System</strong><br/>
  Built for the <strong>Odoo × NMIT Hackathon</strong> — zero cloud dependencies, zero BaaS, fully containerized.
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Setup-One_Command-4CAF50?style=for-the-badge" alt="One Command Setup" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Stack-TypeScript_|_React_|_Postgres-5E7892?style=for-the-badge" alt="Tech Stack" /></a>
  <a href="#-real-time-architecture"><img src="https://img.shields.io/badge/Realtime-Socket.IO-BDCFAA?style=for-the-badge" alt="Socket.IO" /></a>
  <a href="https://github.com/vedeshskhatri/DayflowXNMIT"><img src="https://img.shields.io/badge/License-MIT-A7B7C6?style=for-the-badge" alt="License" /></a>
</p>

---

## 📋 Table of Contents

- [Why Dayflow?](#-why-dayflow)
- [Key Features](#-key-features)
- [Real-Time Architecture](#-real-time-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Demo Walkthrough](#-demo-walkthrough)
- [Design System](#-design-system)
- [Database Schema](#-database-schema)
- [Git & Branching Strategy](#-git--branching-strategy)
- [Team](#-team)
- [License](#-license)

---

## 💡 Why Dayflow?

Most HR tools feel static — you submit a leave request, refresh, wait, refresh again. **Dayflow eliminates the refresh.**

Every state-changing action that affects what another user sees is pushed instantly via **Socket.IO company-scoped rooms**. An employee checks in? Every dashboard viewing that company sees the status dot flip to green — live, no refresh, no polling. An admin approves time-off? The employee's balance and request status update in real time on their screen.

This isn't a bolted-on novelty feature. It's the architectural backbone of the application and the core differentiator from Odoo's native HR module.

---

## ✨ Key Features

### 🔐 Authentication & Access Control
- **Admin/HR-created accounts only** — no public self-registration
- Auto-generated Login IDs following the format `[CompanyCode][Initials][Year][Serial]` (e.g., `DXVESH20260001`)
- Forced password change on first login
- JWT authentication via `httpOnly` cookies (never localStorage)
- Role-based access: **Admin**, **HR Officer**, **Employee**

### 👥 Employee Directory & Profiles
- Searchable card grid with **live presence status dots** (🟢 Present · 🟡 On Leave · 🔴 Absent)
- Tabbed profile view: **About** (bio, skills, certifications) · **Private Info** (personal details) · **Salary Info** (admin-only)
- Employees can edit their own limited fields; Admin/HR can edit all fields for any employee
- Profile picture uploads with Multer

### ⏰ Attendance Tracking
- One-click **Check In / Check Out** from the dashboard
- Real-time presence dot updates across all connected clients
- Employee view: own records, weekly summary (days present, leaves taken, total working days)
- Admin/HR view: all employees, date navigation, search, work hours & extra hours

### 🌴 Time-Off Management
- Leave types: **Paid Time Off**, **Sick Leave** (attachment required), **Unpaid Leave**
- Employee: apply for leave, view balances, track request status in real time
- Admin/HR: approve/reject with instant Socket.IO push to the employee
- Automatic balance decrement on approval

### 💰 Salary & Payroll Visibility
- Admin-controlled salary structure per employee
- Salary components: **FIXED** amount or **PERCENTAGE** of monthly wage
- Auto-recalculation on save — component sum validated to never exceed monthly wage
- PF %, professional tax, and working days/week configuration
- Employee: read-only view of own salary breakdown

---

## ⚡ Real-Time Architecture

Dayflow's real-time layer is built on **Socket.IO** with company-scoped rooms. The JWT is read from the handshake's cookie header — not from `auth: { token }` — because authentication uses `httpOnly` cookies.

```
┌─────────────────┐       Socket.IO        ┌─────────────────────────┐
│   Browser (A)   │ ◄──── WebSocket ──────► │                         │
│   Employee UI   │                         │   Express + Socket.IO   │
└─────────────────┘                         │       Server            │
                                            │                         │
┌─────────────────┐       Socket.IO        │   Room: company:{id}    │
│   Browser (B)   │ ◄──── WebSocket ──────► │                         │
│   Admin UI      │                         │   emitToCompany() broadcasts │
└─────────────────┘                         │   to all connected clients   │
                                            └──────────┬──────────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  PostgreSQL 16  │
                                              │   (via Prisma)  │
                                              └─────────────────┘
```

### Events Emitted

| Event | Trigger | Who Receives |
|---|---|---|
| `attendance:checkin` | Employee checks in | All clients in the company room |
| `attendance:checkout` | Employee checks out | All clients in the company room |
| `presence:update` | Check-in/out changes presence | All clients — dashboard dots update live |
| `timeoff:requested` | Employee submits leave request | Admin/HR clients |
| `timeoff:statusChanged` | Admin approves/rejects | The requesting employee's client |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js + TypeScript | Type-safe backend |
| **API Framework** | Express.js | REST API routes |
| **Database** | PostgreSQL 16 | Relational data store (local, containerized) |
| **ORM** | Prisma | Type-safe database access, migrations, seeding |
| **Validation** | Zod | Request body validation middleware on every route |
| **Auth** | JWT + bcrypt | httpOnly cookie auth, password hashing |
| **Real-Time** | Socket.IO | Company-scoped WebSocket rooms |
| **File Uploads** | Multer | Profile pictures, sick leave attachments |
| **Frontend** | React 18 + Vite | SPA with hot module replacement |
| **Styling** | Tailwind CSS | Utility-first CSS with custom design tokens |
| **Data Fetching** | TanStack React Query | Server state management, cache invalidation |
| **Forms** | React Hook Form + Zod | Performant forms with shared validation schemas |
| **Animations** | Framer Motion | Smooth UI transitions and micro-interactions |
| **Icons** | Lucide React | Consistent, lightweight icon set |
| **Routing** | React Router v6 | Client-side navigation |
| **Infra** | Docker Compose | One-command full-stack orchestration |

### Why This Stack?

Self-built backend, self-designed relational schema, local Postgres — satisfies Odoo's explicit anti-BaaS constraint directly. Socket.IO is the one addition beyond a standard CRUD stack, and it's there because it does real work (live presence, live approvals), not because it's trendy.

---

## 📁 Project Structure

```
DayflowXNMIT/
│
├── backend/                          # Express + TypeScript REST API
│   ├── prisma/
│   │   ├── schema.prisma             # Complete data model (13 models)
│   │   ├── migrations/               # Versioned DB migrations
│   │   └── seed.ts                   # Demo data: company, employees, allocations
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                 # Login, logout, password reset, JWT
│   │   │   ├── employees/            # CRUD, profile updates, Login ID generation
│   │   │   ├── attendance/           # Check-in/out, daily/weekly records
│   │   │   ├── timeoff/              # Requests, approvals, allocations, balances
│   │   │   ├── payroll/              # Salary structure, component computation
│   │   │   └── rewards/              # Rewards & recognition module
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # JWT verification from httpOnly cookie
│   │   │   └── validate.middleware.ts # Zod schema validation wrapper
│   │   ├── sockets/
│   │   │   └── index.ts              # Socket.IO setup, room management, emitToCompany
│   │   ├── lib/                      # Shared utilities
│   │   ├── app.ts                    # Express app configuration
│   │   └── server.ts                 # HTTP + Socket.IO server bootstrap
│   ├── uploads/                      # Profile pics & attachments (Docker volume)
│   ├── Dockerfile                    # Multi-stage build (dev/prod targets)
│   ├── .env.example
│   └── package.json
│
├── frontend/                         # React 18 + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── SignIn.tsx            # Login with Login ID/Email
│   │   │   ├── SignUp.tsx            # Admin: create new employee
│   │   │   ├── ResetPassword.tsx     # Forced first-login password change
│   │   │   ├── Dashboard.tsx         # Landing page with attendance controls
│   │   │   ├── EmployeesPage.tsx     # Employee card grid with live status
│   │   │   ├── AttendancePage.tsx    # Daily/weekly attendance views
│   │   │   ├── TimeOffPage.tsx       # Leave requests & admin approvals
│   │   │   ├── SalaryPage.tsx        # Salary structure (admin edit / employee view)
│   │   │   └── RewardsPage.tsx       # Rewards & recognition
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Persistent top nav (responsive)
│   │   │   ├── EmployeeCard.tsx      # Card with live presence dot
│   │   │   ├── EmployeeProfileView.tsx # Tabbed profile (About/Private/Salary)
│   │   │   ├── AttendanceControl.tsx # Check-in/out button with socket emit
│   │   │   ├── AdminAttendanceView.tsx
│   │   │   ├── EmployeeAttendanceView.tsx
│   │   │   ├── SalaryInfoTab.tsx     # Component editor with auto-calc
│   │   │   ├── AddEmployeeModal.tsx  # New employee creation form
│   │   │   ├── DayflowLogo.tsx       # Brand logo component
│   │   │   └── TagInput.tsx          # Skills/certifications tag editor
│   │   ├── context/                  # React context providers (auth, socket)
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance with cookie credentials
│   │   │   └── socket.ts            # Socket.IO client (cookie-based auth)
│   │   ├── index.css                # Global styles + Tailwind directives
│   │   └── main.tsx                 # App entry point
│   ├── tailwind.config.ts           # Custom design tokens from DESIGN-SYSTEM.md
│   ├── vite.config.ts               # Dev server proxy configuration
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── docs/                             # Complete project documentation
│   ├── PRD.md                        # Product Requirements Document
│   ├── SCHEMA.md                     # Database schema specification
│   ├── APP-FLOW.md                   # Screen-by-screen user flow
│   ├── DESIGN-SYSTEM.md              # Colors, typography, spacing, components
│   ├── TECH-STACK.md                 # Technology choices & rationale
│   ├── GIT-WORKFLOW.md               # Branching, PRs, commit conventions
│   ├── RULES.md                      # Validation & business rule checklist
│   └── 00-STEP-BY-STEP.md           # Phased build plan
│
├── docker-compose.yml                # Full-stack: db + backend + frontend
├── AGENTS.md                         # AI agent guardrails & architectural rules
└── README.md                         # ← You are here
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Docker](https://www.docker.com/) | 24+ | Container runtime |
| [Docker Compose](https://docs.docker.com/compose/) | v2+ | Multi-service orchestration |
| [Git](https://git-scm.com/) | 2.40+ | Version control |

> **Note:** Node.js is _not_ required on your host machine — everything runs inside Docker containers.

### 1. Clone the Repository

```bash
git clone https://github.com/vedeshskhatri/DayflowXNMIT.git
cd DayflowXNMIT
```

### 2. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

> ⚠️ **Important:** Update `JWT_SECRET` in `backend/.env` to a strong, random string before any production-like use.

### 3. Start All Services

```bash
docker compose up -d
```

This spins up three containers:

| Service | Container | Port | URL |
|---|---|---|---|
| **PostgreSQL 16** | `dayflow-db` | `5432` | — |
| **Backend API** | `dayflow-backend` | `4000` | [http://localhost:4000](http://localhost:4000) |
| **Frontend** | `dayflow-frontend` | `5173` | [http://localhost:5173](http://localhost:5173) |

### 4. Run Database Migrations & Seed

```bash
# Apply Prisma migrations
docker exec dayflow-backend npx prisma migrate deploy

# Seed demo data (company, admin, employees, leave allocations)
docker exec dayflow-backend npx prisma db seed
```

### 5. Open the App

Navigate to **[http://localhost:5173](http://localhost:5173)** and sign in with the seeded admin credentials.

### Useful Commands

```bash
# View container logs
docker compose logs -f backend

# Open Prisma Studio (visual DB browser)
docker exec -it dayflow-backend npx prisma studio
# → http://localhost:5555

# Stop all services
docker compose down

# Stop and wipe all data (fresh start)
docker compose down -v
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://dayflow:dayflow@db:5432/dayflow` | PostgreSQL connection string |
| `JWT_SECRET` | `change-this-to-a-long-random-string` | Secret key for signing JWTs |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed CORS origin (must match frontend URL) |
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `4000` | Backend server port |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | Backend API base URL |

---

## 📡 API Reference

All routes are prefixed with `/api`. Authentication is via `httpOnly` JWT cookie (set on login, cleared on logout).

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Sign in with Login ID/Email + password |
| `POST` | `/api/auth/logout` | Authenticated | Clear auth cookie, disconnect socket |
| `POST` | `/api/auth/reset-password` | Authenticated | Change password (forced on first login) |
| `GET` | `/api/auth/me` | Authenticated | Get current user profile |

### Employees

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/employees` | Authenticated | List all employees in company |
| `GET` | `/api/employees/:id` | Authenticated | Get employee by ID |
| `POST` | `/api/employees` | Admin/HR | Create new employee (auto-generates Login ID) |
| `PATCH` | `/api/employees/:id` | Self/Admin | Update employee profile |

### Attendance

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/attendance/checkin` | Authenticated | Check in for today |
| `POST` | `/api/attendance/checkout` | Authenticated | Check out for today |
| `GET` | `/api/attendance` | Authenticated | Get attendance records (own or all) |

### Time-Off

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/timeoff/requests` | Authenticated | List time-off requests |
| `POST` | `/api/timeoff/requests` | Authenticated | Submit a new leave request |
| `PATCH` | `/api/timeoff/requests/:id` | Admin/HR | Approve or reject a request |
| `GET` | `/api/timeoff/allocations` | Authenticated | View leave balances |

### Payroll

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/payroll/:employeeId` | Self/Admin | Get salary structure |
| `PUT` | `/api/payroll/:employeeId` | Admin | Update salary structure & components |

---

## 🎬 Demo Walkthrough

Here's the recommended flow for presenting Dayflow to judges — designed to highlight the real-time differentiator:

### Setup
Open the app in **two browser windows side by side** — one as **Admin**, one as **Employee**.

### Flow

1. **Admin creates a new employee** → Show Login ID auto-generation (`DXJODO20260002`)
2. **Employee logs in** with the generated credentials → Forced password reset screen
3. **Employee checks in** → Watch the Admin's dashboard: the employee's status dot flips from 🔴 to 🟢 **live, no refresh**
4. **Employee submits a Sick Leave request** (with attachment) → It appears instantly in the Admin's time-off queue
5. **Admin approves the request** → The Employee's screen updates: status changes to "Approved", balance decrements — all **in real time**
6. **Admin opens salary tab** → Configure monthly wage, add components (Basic 40%, HRA 20%, etc.), save → auto-recalculation validates sum ≤ wage

---

## 🎨 Design System

Dayflow uses a **warm, light theme** — intentionally designed to feel human and approachable, in contrast to the cold blue-and-white of typical enterprise HR software.

### Color Palette

| Color | Hex | Role |
|---|---|---|
| Warm Cream | `#F3EFDF` | Primary background |
| White | `#FFFFFF` | Elevated surfaces (cards, modals, inputs) |
| Slate Blue | `#5E7892` | Primary brand — buttons, links, active nav |
| Soft Blue-Grey | `#A7B7C6` | Secondary UI — borders, dividers, inactive icons |
| Light Sage | `#BDCFAA` | Success/positive — Present status, Approved badges |
| Deep Sage | `#8E9E83` | Secondary accent — hover states, On Leave badges |
| Terracotta | `#C97B63` | Warning/destructive — Absent status, Reject, errors |

### Typography

- **Headings:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) (600/700 weight)
- **Body:** [Inter](https://fonts.google.com/specimen/Inter) (400/500 weight)

### Status Indicators

| Status | Color | Dot Style |
|---|---|---|
| 🟢 Present | Light Sage `#BDCFAA` | Filled |
| 🟡 On Leave | Deep Sage `#8E9E83` | Half-filled |
| 🔴 Absent | Terracotta `#C97B63` | Filled |

---

## 🗄️ Database Schema

Dayflow uses a self-designed relational schema with **13 models** managed by Prisma:

```
Company ──┐
           ├── Employee ──┬── Skill
           │              ├── Certification
           │              ├── Attendance (unique per employee per day)
           │              ├── TimeOffRequest ──── TimeOffType
           │              ├── TimeOffAllocation ── TimeOffType
           │              └── SalaryStructure ──── SalaryComponent
           │
           └── (company-scoped Socket.IO rooms)
```

### Key Design Decisions

- **Login ID auto-generation**: `[CompanyCode][FirstName2][LastName2][JoinYear][Serial4]` — deterministic, human-readable, company-scoped
- **One attendance row per employee per day**: enforced via `@@unique([employeeId, date])`
- **Salary components**: FIXED or PERCENTAGE, `computedAmount` resolved server-side on save — sum validated against `monthlyWage`
- **Presence status**: enum (`PRESENT` / `ON_LEAVE` / `ABSENT`) on the Employee model, updated atomically with attendance/time-off actions

> 📖 Full Prisma schema: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)

---

## 🌿 Git & Branching Strategy

### Branch Naming

```
feat/<domain>        →  feat/auth, feat/profile, feat/timeoff
fix/<description>    →  fix/checkout-before-checkin-validation
```

### Commit Convention

```
<type>(<scope>): <short description>
```

| Type | Usage |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Build, config, tooling |
| `docs` | Documentation only |
| `refactor` | Code restructure, no behavior change |

**Examples:**
```
feat(auth): implement login ID auto-generation
feat(timeoff): approve/reject endpoint with live socket push
fix(attendance): correct checkout-before-checkin validation
```

### PR Process

1. Branch off `main` → build → commit in small, real chunks
2. Push branch, open PR into `main`
3. One teammate reviews the diff (even a 2-minute glance)
4. Merge, delete branch, pull `main` before starting next branch

---

## 👥 Team

<table>
  <tr>
    <td align="center"><strong>Vedesh Khatri</strong><br/><em>Lead · Auth · Architecture · Sockets</em><br/><code>feat/auth</code> · <code>feat/sockets</code></td>
    <td align="center"><strong>Aryan</strong><br/><em>Employee Directory · Profiles · Attendance</em><br/><code>feat/profile</code> · <code>feat/attendance</code></td>
    <td align="center"><strong>Swapnil</strong><br/><em>Time-Off · Payroll · Salary</em><br/><code>feat/timeoff</code> · <code>feat/payroll</code></td>
  </tr>
</table>

---

## 📄 License

This project was built for the **Odoo × NMIT Hackathon**. All code is original and self-built — no BaaS, no cloud dependencies, no copy-paste.

---

<p align="center">
  <strong>Dayflow</strong> — <em>Every workday, perfectly aligned.</em>
</p>
