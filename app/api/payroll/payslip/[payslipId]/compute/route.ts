import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PayslipStatus } from "@/lib/generated/prisma/client";
import { computeSalaryBreakdown } from "@/lib/payroll";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ payslipId: string }> }
) {
  const { payslipId } = await params;
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      payrun: true,
      user: {
        include: {
          salaryInfo: true,
          attendanceRecords: true,
          timeOffRequests: true,
        },
      },
    },
  });

  if (!payslip) return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
  if (payslip.status === PayslipStatus.VALIDATED)
    return NextResponse.json({ error: "Cannot recompute a validated payslip" }, { status: 400 });

  const info = payslip.user.salaryInfo;
  if (!info) return NextResponse.json({ error: "Employee has no salary info" }, { status: 400 });

  const company = await prisma.company.findUnique({
    where: { id: payslip.payrun.companyId },
    select: { pfEmployeePct: true, pfEmployerPct: true, professionalTax: true },
  });
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const pfEmployeePct =
    info.pfEmployeePctOverride ??
    Number(company.pfEmployeePct);

  const config = {
    pfEmployeePct,
    pfEmployerPct: Number(company.pfEmployerPct),
    professionalTax: Number(company.professionalTax),
  };

  const { month, year } = payslip.payrun;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const attendance = payslip.user.attendanceRecords.filter(
    (a) => a.date >= startDate && a.date <= endDate
  );
  const leaves = payslip.user.timeOffRequests.filter(
    (l) => l.status === "APPROVED" && l.startDate <= endDate && (!l.endDate || l.endDate >= startDate)
  );

  const totalWorkingDays = countWorkingDays(year, month);
  const attendanceDays = attendance.filter((a) => a.checkIn !== null).length;
  const paidLeaveDays = leaves.filter((l) => l.type === "PAID").reduce((s, l) => s + l.days.toNumber(), 0);
  const unpaidLeaveDays = leaves.filter((l) => l.type === "UNPAID").reduce((s, l) => s + l.days.toNumber(), 0);

  const fullBreakdown = computeSalaryBreakdown(info, config);

  function round(n: number) {
    return Math.round(n * 100) / 100;
  }

  const bonusPerDay =
    totalWorkingDays > 0
      ? fullBreakdown.bonus / totalWorkingDays
      : 0;

  const unpaidLeaveDeduction = round(
    bonusPerDay * unpaidLeaveDays
  );
  const totalDeductions = round(
    fullBreakdown.pfEmployee +
    fullBreakdown.pfEmployer +
    fullBreakdown.professionalTax +
    unpaidLeaveDeduction
  );

  const netWage = round(
    fullBreakdown.grossWage - totalDeductions
  );
  const updated = await prisma.payslip.update({
    where: { id: payslip.id },
    data: {
      monthlyWage: fullBreakdown.monthlyWage,
      basicSalary: fullBreakdown.basicSalary,
      hra: fullBreakdown.hra,
      standardAllowance: fullBreakdown.standardAllowance,
      bonus: fullBreakdown.bonus,
      lta: fullBreakdown.lta,
      fixedAllowance: fullBreakdown.fixedAllowance,
      grossWage: fullBreakdown.grossWage,
      pfEmployee: fullBreakdown.pfEmployee,
      pfEmployer: fullBreakdown.pfEmployer,
      professionalTax: fullBreakdown.professionalTax,
      totalDeductions,
      netWage,
      employerCost: fullBreakdown.employerCost,
      unpaidLeaveDeduction
    },
  });

  return NextResponse.json({ payslip: updated });
}

function countWorkingDays(year: number, month: number): number {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}