import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, PayslipStatus } from "@/lib/generated/prisma/client";
import { computeSalaryBreakdown } from "@/lib/payroll";

export async function POST(req: NextRequest) {
  const { payrunId } = await req.json();
  if (!payrunId) {
    return NextResponse.json({ error: "payrunId required" }, { status: 400 });
  }
  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: {
      payslips: {
        include: {
          user: {
            include: {
              salaryInfo: true,
              attendanceRecords: true,
              timeOffRequests: true,
            },
          },
        },
      },
    },
  });

  if (!payrun) {
    return NextResponse.json({ error: "Payrun not found" }, { status: 404 });
  }

  const company = await prisma.company.findUnique({
    where: { id: payrun.companyId },
    select: {
      pfEmployeePct: true,
      pfEmployerPct: true,
      professionalTax: true,
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Month boundaries (IMPORTANT for attendance + leave filtering)
  const startDate = new Date(payrun.year, payrun.month - 1, 1);
  const endDate = new Date(payrun.year, payrun.month, 0);

  for (const payslip of payrun.payslips) {
    const user = payslip.user;
    const info = user.salaryInfo;

    if (!info) continue;
    const pfEmployeePct =
      info.pfEmployeePctOverride ??
      Number(company.pfEmployeePct);

    const config = {
      pfEmployeePct,
      pfEmployerPct: Number(company.pfEmployerPct),
      professionalTax: Number(company.professionalTax),
    };

    const attendance = user.attendanceRecords.filter(
      (a) => a.date >= startDate && a.date <= endDate
    );

    const leaves = user.timeOffRequests.filter(
      (l) =>
        l.status === "APPROVED" &&
        l.startDate <= endDate &&
        (!l.endDate || l.endDate >= startDate)
    );

    const totalWorkingDays = countWorkingDays(payrun.year, payrun.month);

    const attendanceDays = attendance.filter(a => a.checkIn !== null).length;

    const paidLeaveDays = leaves
      .filter(l => l.type === "PAID")
      .reduce((sum, l) => sum + l.days.toNumber(), 0);

    const unpaidLeaveDays = leaves
      .filter(l => l.type === "UNPAID")
      .reduce((sum, l) => sum + l.days.toNumber(), 0);

    const totalPayableDays = Math.min(attendanceDays + paidLeaveDays, totalWorkingDays);

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
    await prisma.payslip.update({
      where: { id: payslip.id },
      data: {
        status: PayslipStatus.COMPUTED,
        attendanceDays,
        paidLeaveDays,
        unpaidLeaveDays,
        totalPayableDays,
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
  }

  await prisma.payrun.update({
    where: { id: payrunId },
    data: { status: PayslipStatus.COMPUTED },
  });

  return NextResponse.json({ success: true });
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