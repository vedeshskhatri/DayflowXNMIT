# Dayflow HRMS — Step-by-Step Build Sequence

Repo: https://github.com/vedeshskhatri/DayflowXNMIT.git
Team: Vedesh (repo owner, auth + architecture + sockets), Aryan (profile + attendance), Swapnil (time-off + payroll)

Read this first. Everyone reads all the docs in `/docs` before opening Antigravity — not just their own section.

---

## Phase 0 — Setup (all three, ~20 min, do this together on a call)

1. **Vedesh**: Create the repo at the URL above, push an empty README + `.gitignore` (Node) + this whole `/docs` folder as the first commit.
2. **Vedesh**: Add Aryan and Swapnil as collaborators (Settings → Collaborators) — not just "send me your code."
3. **Everyone**: Clone the repo locally. Confirm you're pushing under your own GitHub account (`git config user.name` / `user.email` — set this per-machine if using shared laptops).
4. **Vedesh**: Create the base folder structure:
   ```
   /backend       — Express + TS + Prisma
   /frontend      — React + Vite + Tailwind
   /docs          — this entire doc set
   docker-compose.yml
   AGENTS.md      — from RULES.md, root of repo, Antigravity reads this automatically
   ```
5. **Vedesh**: Push `docker-compose.yml`, empty backend/frontend skeletons (just `package.json` + tsconfig), and `AGENTS.md`. This is commit #2. Tag it or note it as the integration base.
6. **Everyone**: Pull, run `docker compose up -d db`, confirm Postgres is reachable locally before writing any code.

---

## Phase 1 — Branch out and build in parallel

Branch naming: `feat/<domain>-<short-desc>`

| Who | Branch | Builds |
|---|---|---|
| Vedesh | `feat/auth`, `feat/sockets` | Auth, RBAC, Login ID generator, Socket.IO server setup, seed script |
| Aryan | `feat/profile`, `feat/attendance` | Employee CRUD, profile view/edit, check-in/out, attendance list |
| Swapnil | `feat/timeoff`, `feat/payroll` | Time-off request/approval flow, salary info tab |

**Order matters — Vedesh goes first on the shared pieces:**
1. Vedesh pushes the Prisma schema (from `SCHEMA.md`) and runs the first migration — everyone needs this before their own models will work.
2. Vedesh pushes the auth middleware + a working login endpoint + Socket.IO server boilerplate.
3. Once that's merged to `main`, Aryan and Swapnil branch off `main` and build their domains independently.

Each person works off their own prompt file:
- `VEDESH-PROMPTS.md`
- `ARYAN-PROMPTS.md`
- `SWAPNIL-PROMPTS.md`

These have exact prompts to paste into Antigravity, in the order to run them.

---

## Phase 2 — Integration checkpoint (hard stop, mid-build)

Don't skip this. Set a real time for it (e.g. hour 4 of an 8-hour build).

At the checkpoint, everyone merges into `main` via PR (even a fast self-reviewed one — the point is the repo shows real merge history, not everyone pushing straight to main). Confirm together:
- [ ] Login works end-to-end, returns a real JWT/session
- [ ] Employee cards render from the real DB (not mock JSON)
- [ ] Check-in emits a socket event and *something* on Aryan's or Vedesh's screen updates live
- [ ] A time-off request created by Swapnil's flow shows up in the DB and is visible to an admin account

If any of these are broken, fix them now — not in the last hour.

---

## Phase 3 — Polish pass (final stretch)

- Apply `DESIGN-SYSTEM.md` consistently — this is when mismatched colors/spacing across the three people's screens get caught and fixed
- Run through `RULES.md` validation checklist — make sure every required-field and business rule actually throws a visible error, not a silent failure
- Seed realistic demo data (5-8 employees, a mix of present/on-leave/absent statuses, a pending time-off request ready to approve live in the demo)
- Rehearse the demo script: show the **live** socket updates on two screens side by side — this is your differentiator, make sure it's visually obvious to judges

---

## Phase 4 — Submission

- Final commit history should show contributions from all three GitHub accounts — this directly maps to the "one member managing repo is not enough" must-have
- README updated with setup instructions (`docker compose up`), screenshots, and a one-paragraph pitch on the real-time differentiator
- Confirm `docker compose up` works on a clean clone before submitting — judges may actually run it locally
