-- CreateEnum
CREATE TYPE "PointReason" AS ENUM ('DAILY_CHECKIN', 'EARLY_CHECKIN', 'FULL_DAY_WORK', 'STREAK_7', 'STREAK_30', 'STREAK_90', 'PROFILE_COMPLETE', 'EARLY_LEAVE_REQUEST', 'ADMIN_AWARD', 'ADMIN_DEDUCT', 'EASTER_EGG');

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('APPROVED', 'PENDING_HR', 'REJECTED');

-- CreateTable
CREATE TABLE "EmployeePoints" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "maxStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCheckInDate" TIMESTAMP(3),
    "easterEggUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EmployeePoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "pointsId" TEXT NOT NULL,
    "reason" "PointReason" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎁',
    "pointCost" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Physical',
    "stockCount" INTEGER NOT NULL DEFAULT -1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "pointsId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "pointCost" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'APPROVED',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeBadge" (
    "id" TEXT NOT NULL,
    "pointsId" TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeePoints_employeeId_key" ON "EmployeePoints"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_key_key" ON "Badge"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeBadge_pointsId_badgeKey_key" ON "EmployeeBadge"("pointsId", "badgeKey");

-- AddForeignKey
ALTER TABLE "EmployeePoints" ADD CONSTRAINT "EmployeePoints_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_pointsId_fkey" FOREIGN KEY ("pointsId") REFERENCES "EmployeePoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_pointsId_fkey" FOREIGN KEY ("pointsId") REFERENCES "EmployeePoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeBadge" ADD CONSTRAINT "EmployeeBadge_pointsId_fkey" FOREIGN KEY ("pointsId") REFERENCES "EmployeePoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeBadge" ADD CONSTRAINT "EmployeeBadge_badgeKey_fkey" FOREIGN KEY ("badgeKey") REFERENCES "Badge"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
