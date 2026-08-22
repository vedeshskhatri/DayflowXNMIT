# Dayflow — Database Schema

Prisma schema, PostgreSQL. Vedesh owns this file — pushed and migrated before Aryan/Swapnil branch off for their domains.

## Login ID Format

`[CC][First 2 letters of first name][First 2 letters of last name][Year of joining][Serial number of joining for that year, 4 digits]`

Example: `DX` + `VE` + `SH` + `2026` + `0001` → `DXVESH20260001`
(CC = company code, set per company at creation — default `DX` for Dayflow x NMIT demo data)

Generation logic lives server-side in the employee-creation service, never client-editable.

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Company {
  id        String     @id @default(uuid())
  name      String
  code      String     @unique // e.g. "DX" — used in Login ID generation
  logoUrl   String?
  employees Employee[]
  createdAt DateTime   @default(now())
}

model Employee {
  id                 String              @id @default(uuid())
  loginId            String              @unique
  companyId          String
  company             Company            @relation(fields: [companyId], references: [id])
  firstName          String
  lastName            String
  email               String             @unique
  phone               String?
  passwordHash        String
  mustResetPwd        Boolean            @default(true)
  role                Role               @default(EMPLOYEE)
  profilePicUrl        String?
  bio                  String?
  jobLove              String?           // "what I love about my job"
  interests            String?
  dateOfBirth          DateTime?
  address              String?
  personalEmail        String?
  gender               String?
  maritalStatus        String?
  jobTitle             String?
  department           String?
  managerId            String?
  dateOfJoining        DateTime
  joiningSerial        Int               // serial number within joining year, for Login ID generation
  status               PresenceStatus    @default(ABSENT)

  skills               Skill[]
  certifications       Certification[]
  attendances          Attendance[]
  timeOffRequests      TimeOffRequest[]  @relation("RequesterRequests")
  timeOffAllocations   TimeOffAllocation[]
  salary               SalaryStructure?

  createdAt            DateTime          @default(now())
}

enum Role { EMPLOYEE ADMIN HR_OFFICER }
enum PresenceStatus { PRESENT ON_LEAVE ABSENT }

model Skill {
  id         String   @id @default(uuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  name       String
}

model Certification {
  id         String   @id @default(uuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  name       String
}

model Attendance {
  id         String    @id @default(uuid())
  employeeId String
  employee   Employee  @relation(fields: [employeeId], references: [id])
  date       DateTime  @db.Date
  checkIn    DateTime?
  checkOut   DateTime?
  workHours  Float?
  extraHours Float?

  @@unique([employeeId, date]) // one attendance row per employee per day
}

model TimeOffType {
  id            String  @id @default(uuid())
  name          String  // "Paid Time Off" | "Sick Leave" | "Unpaid Leave"
  requiresProof Boolean @default(false)
  allocations   TimeOffAllocation[]
  requests      TimeOffRequest[]
}

model TimeOffAllocation {
  id            String      @id @default(uuid())
  employeeId    String
  employee      Employee    @relation(fields: [employeeId], references: [id])
  typeId        String
  type          TimeOffType @relation(fields: [typeId], references: [id])
  daysAllocated Float
  daysUsed      Float       @default(0)
  validFrom     DateTime
  validTo       DateTime
}

model TimeOffRequest {
  id            String        @id @default(uuid())
  employeeId    String
  employee      Employee      @relation("RequesterRequests", fields: [employeeId], references: [id])
  typeId        String
  type          TimeOffType   @relation(fields: [typeId], references: [id])
  startDate     DateTime
  endDate       DateTime
  daysCount     Float
  remarks       String?
  attachmentUrl String?
  status        RequestStatus @default(PENDING)
  reviewedById  String?
  reviewedAt    DateTime?
  createdAt     DateTime      @default(now())
}

enum RequestStatus { PENDING APPROVED REJECTED }

model SalaryStructure {
  id                String   @id @default(uuid())
  employeeId        String   @unique
  employee          Employee @relation(fields: [employeeId], references: [id])
  monthlyWage       Float
  compositionType   CompositionType @default(PERCENTAGE)
  workingDaysPerWeek Int     @default(5)

  components        SalaryComponent[]
  pfPercent         Float    @default(12)
  professionalTax   Float    @default(200)
  updatedAt         DateTime @updatedAt
}

enum CompositionType { FIXED PERCENTAGE }

model SalaryComponent {
  id                String          @id @default(uuid())
  salaryStructureId String
  salaryStructure   SalaryStructure @relation(fields: [salaryStructureId], references: [id])
  name              String          // Basic, HRA, Standard Allowance, Performance Bonus, Travel Allowance, Fixed Allowance
  valueType         CompositionType // FIXED or PERCENTAGE
  value             Float           // amount, or % if PERCENTAGE
  computedAmount    Float           // resolved amount after calculation, stored for read speed
}
```

## Salary Auto-Calc Rule (implement server-side, on save — not live per keystroke)

1. Basic = `basicPct% of monthlyWage` (if PERCENTAGE) or fixed value
2. HRA and other % components resolve against **Basic**, not raw wage, unless specified otherwise
3. Sum of all `computedAmount` across components must not exceed `monthlyWage` — validate and reject save if it does
4. Recompute all `computedAmount` values whenever `monthlyWage` changes

## Seed Data Checklist

- 1 Company (code `DX`)
- 1 Admin account
- 5–8 Employee accounts with varied `status` (mix of PRESENT/ON_LEAVE/ABSENT) so the dashboard looks alive on first load
- 3 TimeOffTypes (Paid, Sick, Unpaid) with allocations per employee
- 1–2 PENDING TimeOffRequests ready to approve live during the demo
