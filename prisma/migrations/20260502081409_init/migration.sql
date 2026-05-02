-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('IN_OFFICE', 'ON_LEAVE', 'ABSENT');

-- CreateEnum
CREATE TYPE "TimeOffType" AS ENUM ('PAID', 'SICK', 'UNPAID');

-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'COMPUTED', 'VALIDATED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "loginPrefix" VARCHAR(4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "personalEmail" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "profilePicUrl" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "companyId" TEXT NOT NULL,
    "department" TEXT,
    "jobPosition" TEXT,
    "location" TEXT,
    "managerId" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "joiningYear" INTEGER,
    "dateOfBirth" TIMESTAMP(3),
    "residingAddress" TEXT,
    "nationality" TEXT,
    "gender" TEXT,
    "maritalStatus" TEXT,
    "about" TEXT,
    "whatILove" TEXT,
    "interests" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoiningSerial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastSerial" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JoiningSerial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "uanNumber" TEXT,
    "employeeCode" TEXT,

    CONSTRAINT "BankDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyWage" DECIMAL(12,2) NOT NULL,
    "workingDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "breakTimeHrs" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "basicSalaryPct" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "hraPct" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "standardAllowance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonusPct" DECIMAL(5,2) NOT NULL DEFAULT 8.33,
    "ltaPct" DECIMAL(5,2) NOT NULL DEFAULT 8.33,
    "pfEmployeePct" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "pfEmployerPct" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "professionalTax" DECIMAL(8,2) NOT NULL DEFAULT 200,

    CONSTRAINT "SalaryInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "year" INTEGER,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "workHours" DECIMAL(5,2),
    "extraHours" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TimeOffType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "days" DECIMAL(5,1) NOT NULL,
    "status" "TimeOffStatus" NOT NULL DEFAULT 'PENDING',
    "attachmentUrl" TEXT,
    "note" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeOffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payrun" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payrun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "payrunId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "salaryStructure" TEXT NOT NULL DEFAULT 'Regular Pay',
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "attendanceDays" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "paidLeaveDays" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "unpaidLeaveDays" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "totalPayableDays" DECIMAL(5,1) NOT NULL DEFAULT 0,
    "monthlyWage" DECIMAL(12,2) NOT NULL,
    "basicSalary" DECIMAL(12,2) NOT NULL,
    "hra" DECIMAL(12,2) NOT NULL,
    "standardAllowance" DECIMAL(12,2) NOT NULL,
    "bonus" DECIMAL(12,2) NOT NULL,
    "lta" DECIMAL(12,2) NOT NULL,
    "fixedAllowance" DECIMAL(12,2) NOT NULL,
    "grossWage" DECIMAL(12,2) NOT NULL,
    "pfEmployee" DECIMAL(12,2) NOT NULL,
    "pfEmployer" DECIMAL(12,2) NOT NULL,
    "professionalTax" DECIMAL(8,2) NOT NULL,
    "tdsDeduction" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netWage" DECIMAL(12,2) NOT NULL,
    "employerCost" DECIMAL(12,2) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "JoiningSerial_companyId_year_key" ON "JoiningSerial"("companyId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_userId_key" ON "BankDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryInfo_userId_key" ON "SalaryInfo"("userId");

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_userId_date_key" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE INDEX "TimeOffRequest_userId_status_idx" ON "TimeOffRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "TimeOffRequest_startDate_endDate_idx" ON "TimeOffRequest"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payrun_companyId_month_year_key" ON "Payrun"("companyId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payrunId_userId_key" ON "Payslip"("payrunId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryInfo" ADD CONSTRAINT "SalaryInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrunId_fkey" FOREIGN KEY ("payrunId") REFERENCES "Payrun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
