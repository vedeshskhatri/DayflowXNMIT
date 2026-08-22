# Dayflow — App Flow

## 1. Auth Flow

```
Admin/HR logs in
  → Employees page → "Add Employee" → fills Sign-Up form
    (Company [pre-filled if existing], Name, Email, Phone, Password auto-generated)
  → System generates Login ID: [CC][initials][year][serial]
  → New employee record created, status = ABSENT, temp password set
  → Employee receives Login ID + temp password (displayed to Admin post-creation, or emailed if time allows)

Employee (or Admin/HR) — Sign In
  → Enter Login ID/Email + Password
  → Wrong credentials → inline error, no redirect
  → Correct credentials, mustResetPwd = true → forced password change screen → then continue
  → Correct credentials, mustResetPwd = false → redirect to Employees dashboard
```

## 2. Main Dashboard (Employees page — landing after login)

```
Employees page loads
  → Fetch all employees in company (real-time subscribed via socket room)
  → Render card grid, each card: photo, name, live status dot
  → [Check In] button visible if not yet checked in today
     → click → POST /attendance/checkin → emit `attendance:checkin` + `presence:update`
     → own status dot flips to green, live, no refresh
  → [Check Out] button visible if checked in
     → click → POST /attendance/checkout → emit `attendance:checkout` + `presence:update`
  → Click any employee card → navigate to /employees/:id (view-only mode)
  → Click own avatar (top right) → dropdown → My Profile (edit mode) / Log Out
```

## 3. Employee Profile

```
/employees/:id (viewing someone else) → view-only render, Salary Info tab hidden unless viewer is Admin
/profile (viewing self) → editable render
  Tabs: About | Private Info | Salary Info (Admin-only)

About tab
  → Bio, "what I love about my job", interests — editable textareas (self only)
  → Skills / Certifications — tag input, add/remove

Private Info tab
  → DOB, address, personal email, gender, marital status, DOJ
  → Employee can edit: address, phone, profile picture
  → Admin editing someone else: can edit all fields

Salary Info tab (Admin only, hidden entirely from employee's own view per wireframe note)
  → Set Monthly/Yearly Wage
  → Add salary components (Basic, HRA, Standard Allowance, etc.) — fixed amount or % of wage
  → On save: recalculate all % based components against new wage, validate sum ≤ wage
  → Set PF %, working days/week
```

## 4. Attendance

```
Employee view (/attendance)
  → Own records only, weekly view default
  → Summary: days present, leaves taken, total working days
  → Date navigation (prev/next, date picker)

Admin/HR view (/attendance, role-gated)
  → All employees, current day default
  → Search bar, date navigation
  → Table: Employee, Check In, Check Out, Work Hours, Extra Hours
  → Subscribes to `attendance:checkin` / `attendance:checkout` sockets → rows update live
```

## 5. Time-Off

```
Employee view (/timeoff)
  → Balances shown top (Paid Time Off: N days, Sick Leave: N days)
  → Calendar picker
  → [New Request] → modal: Time Off Type, Validity Period (from-to), Allocation days (auto-calc from range), Attachment (required if Sick)
  → Submit → POST /timeoff/requests → status PENDING
     → emits `timeoff:requested` to Admin/HR clients
  → Own request list, status updates live when Admin acts on it (`timeoff:statusChanged` received)

Admin/HR view (/timeoff, role-gated)
  → Tabs: Time Off (all requests) | Allocation (per-employee balances)
  → Requests table: Name, Start Date, End Date, Type, Status, [Approve] [Reject]
  → Action → PATCH /timeoff/requests/:id → emits `timeoff:statusChanged` to that employee
  → Balance auto-decrements on approval
```

## 6. Cross-Cutting: Real-Time Layer

Every state-changing action that affects what someone else is looking at must emit a socket event. This is the checklist to verify before demo:
- [ ] Check-in/out → presence dot updates on someone else's open dashboard, no refresh
- [ ] Time-off request submitted → appears in Admin's queue live
- [ ] Time-off approved/rejected → employee's own status updates live
