/*
  Warnings:

  - You are about to drop the column `pfEmployeePct` on the `SalaryInfo` table. All the data in the column will be lost.
  - You are about to drop the column `pfEmployerPct` on the `SalaryInfo` table. All the data in the column will be lost.
  - You are about to drop the column `professionalTax` on the `SalaryInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SalaryInfo" DROP COLUMN "pfEmployeePct",
DROP COLUMN "pfEmployerPct",
DROP COLUMN "professionalTax";

-- CreateTable
CREATE TABLE "PayrollConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pfEmployeePct" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "pfEmployerPct" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "professionalTax" DECIMAL(8,2) NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayrollConfig_companyId_key" ON "PayrollConfig"("companyId");

-- AddForeignKey
ALTER TABLE "PayrollConfig" ADD CONSTRAINT "PayrollConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
