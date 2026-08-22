-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'ADMIN', 'HR_OFFICER');

-- CreateEnum
CREATE TYPE "PresenceStatus" AS ENUM ('PRESENT', 'ON_LEAVE', 'ABSENT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CompositionType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "mustResetPwd" BOOLEAN NOT NULL DEFAULT true,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "profilePicUrl" TEXT,
    "bio" TEXT,
    "jobLove" TEXT,
    "interests" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "personalEmail" TEXT,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "managerId" TEXT,
    "dateOfJoining" TIMESTAMP(3) NOT NULL,
    "joiningSerial" INTEGER NOT NULL,
    "status" "PresenceStatus" NOT NULL DEFAULT 'ABSENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "workHours" DOUBLE PRECISION,
    "extraHours" DOUBLE PRECISION,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresProof" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TimeOffType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffAllocation" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "daysAllocated" DOUBLE PRECISION NOT NULL,
    "daysUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeOffAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysCount" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "attachmentUrl" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeOffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "monthlyWage" DOUBLE PRECISION NOT NULL,
    "compositionType" "CompositionType" NOT NULL DEFAULT 'PERCENTAGE',
    "workingDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "pfPercent" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "professionalTax" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "salaryStructureId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "valueType" "CompositionType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "computedAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_loginId_key" ON "Employee"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_employeeId_key" ON "SalaryStructure"("employeeId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffAllocation" ADD CONSTRAINT "TimeOffAllocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffAllocation" ADD CONSTRAINT "TimeOffAllocation_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TimeOffType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TimeOffType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
