# Dayflow — Human Resource Management System 🚀

> *"Every workday, perfectly aligned."*  
> **Odoo x NMIT Hackathon Project**

Dayflow is a modern, real-time, locally-hosted Human Resource Management System (HRMS) built without BaaS/cloud dependencies. Featuring real-time presence tracking, attendance management, time-off approvals, and role-gated payroll structure visibility.

---

## ⚡ Key Differentiator: Real-Time Sync

Dayflow uses **Socket.IO** with company-scoped rooms to deliver instant synchronization across clients:
- **Live Presence Dots**: Checking in or out flips employee status dots in real time across all open dashboards without page refreshes.
- **Instant Approvals**: Time-off submissions and manager approvals/rejections propagate live to employee and admin screens.

---

## 🛠️ Tech Stack (Locked)

- **Backend**: Node.js, Express, TypeScript
- **Database & ORM**: PostgreSQL 16 (local containerized), Prisma ORM
- **Frontend**: React 18, Vite, Tailwind CSS, TanStack React Query, React Hook Form + Zod
- **Real-Time**: Socket.IO (handshake cookie auth, company-scoped rooms)
- **Infrastructure**: Docker Compose (`db`, `backend`, `frontend`)
- **Typography & Styling**: Space Grotesk (headings), Inter (body), custom warm cream & sage design system

---

## 📂 Project Structure

```
DayflowXNMIT/
├── docs/                        # Complete project specifications & prompts
│   ├── 00-STEP-BY-STEP.md
│   ├── PRD.md
│   ├── TECH-STACK.md
│   ├── SCHEMA.md
│   ├── APP-FLOW.md
│   ├── DESIGN-SYSTEM.md
│   ├── RULES.md
│   ├── GIT-WORKFLOW.md
│   ├── VEDESH-PROMPTS.md
│   ├── ARYAN-PROMPTS.md
│   └── SWAPNIL-PROMPTS.md
├── backend/                     # Express + TypeScript + Prisma API
│   ├── prisma/                  # schema.prisma, migrations, seed.ts
│   ├── src/
│   │   ├── modules/             # auth, employees, attendance, timeoff, payroll
│   │   ├── middleware/          # auth, validate, requestId
│   │   ├── sockets/             # Socket.IO handlers & emitToCompany
│   │   ├── app.ts
│   │   └── server.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/                    # React + Vite + Tailwind UI
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── lib/                 # api.ts, socket.ts
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml           # One-command full-stack containerization
├── AGENTS.md                    # Core agent instructions & architectural rules
└── README.md
```

---

## 🚀 Quick Start (One-Command Run)

### 1. Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js 20+](https://nodejs.org/) & Git

### 2. Clone & Setup Environment
```bash
git clone https://github.com/vedeshskhatri/DayflowXNMIT.git
cd DayflowXNMIT

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Spin Up Containers
```bash
docker compose up -d
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 👥 Team & Roles

| Member | Branch Domain | Responsibilities |
|---|---|---|
| **Vedesh (Lead)** | `feat/auth`, `feat/sockets` | Auth, Architecture, Prisma DB, Sockets real-time infra |
| **Aryan** | `feat/profile`, `feat/attendance` | Employee directory, profile management, check-in/out attendance |
| **Swapnil** | `feat/timeoff`, `feat/payroll` | Time-off requests & approvals, salary structure visibility |

---

## 🌿 Git & Branching Strategy

Follow standard branch naming convention:
- `feat/auth`
- `feat/sockets`
- `feat/profile`
- `feat/attendance`
- `feat/timeoff`
- `feat/payroll`
- `fix/<description>`

Commit format: `<type>(<scope>): <short description>` (e.g. `feat(auth): implement login ID generation`)
