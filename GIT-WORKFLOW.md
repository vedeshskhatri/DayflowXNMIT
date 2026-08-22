# Dayflow — Git Workflow

Repo: https://github.com/vedeshskhatri/DayflowXNMIT.git
Owner: Vedesh. Collaborators: Aryan, Swapnil (added via GitHub Settings → Collaborators, not code sent over chat).

This directly satisfies Odoo's must-have: *"Use version control (Git) properly; one member managing the repo is not enough."* Judges can check the contributor graph — make sure it's real.

## 1. Setup (Vedesh, first)

```bash
git clone https://github.com/vedeshskhatri/DayflowXNMIT.git
cd DayflowXNMIT
# add docs/, .gitignore, AGENTS.md, docker-compose.yml
git add .
git commit -m "chore: initial repo structure, docs, and AGENTS.md"
git push origin main
```

Add collaborators: GitHub repo → Settings → Collaborators and teams → Add people → invite Aryan and Swapnil by GitHub username.

## 2. Everyone: clone and configure

```bash
git clone https://github.com/vedeshskhatri/DayflowXNMIT.git
cd DayflowXNMIT
git config user.name "Your Actual Name"
git config user.email "your.github.email@example.com"
```

## 3. Branch naming

```
feat/auth
feat/sockets
feat/profile
feat/attendance
feat/timeoff
feat/payroll
fix/<short-description>
```

## 4. Standard flow per feature

```bash
git checkout main
git pull origin main
git checkout -b feat/attendance
# ... work, commit in small real chunks ...
git add .
git commit -m "feat(attendance): add check-in/check-out endpoints with socket emit"
git push origin feat/attendance
# open PR on GitHub: feat/attendance → main
```

## 5. Commit message convention

`<type>(<scope>): <short description>`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`

Examples:
- `feat(auth): implement login ID auto-generation`
- `feat(timeoff): approve/reject endpoint with live socket push`
- `fix(attendance): correct checkout-before-checkin validation`
- `docs: add schema.md`

## 6. PR process (keep it fast, but real)

1. Push your branch, open a PR into `main`
2. One other teammate glances at the diff (even 2 minutes) and approves — the goal is a real merge record, not a heavyweight review process
3. Merge, delete the branch
4. Pull `main` locally before starting your next branch

## 7. Integration checkpoint merges

At the Phase 2 checkpoint (see `00-STEP-BY-STEP.md`), all in-progress branches should be PR'd into `main` together, even if incomplete — so everyone is building on the same base going into the final stretch. Resolve conflicts together on the call, don't leave one person to untangle it alone.

## 8. Before submission

```bash
git log --oneline --all --graph
```
Confirm commits from all three accounts are visible and roughly balanced. If one person's branch has a single giant commit, that's a red flag — worth knowing before judges see it, not after.
