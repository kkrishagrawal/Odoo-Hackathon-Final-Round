import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, PayslipStatus } from "@/lib/generated/prisma/client";
import { computeSalaryBreakdown, scaleToPayableDays } from "@/lib/payroll";

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

  const config = {
    pfEmployeePct: Number(company.pfEmployeePct),
    pfEmployerPct: Number(company.pfEmployerPct),
    professionalTax: Number(company.professionalTax),
  };

  // Month boundaries (IMPORTANT for attendance + leave filtering)
  const startDate = new Date(payrun.year, payrun.month - 1, 1);
  const endDate = new Date(payrun.year, payrun.month, 0);

  for (const payslip of payrun.payslips) {
    const user = payslip.user;
    const info = user.salaryInfo;

    if (!info) continue;

    // ✅ Filter attendance for this payrun month
    const attendance = user.attendanceRecords.filter(
      (a) => a.date >= startDate && a.date <= endDate
    );

    // ✅ Filter leaves for this payrun month
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
    const scaled = scaleToPayableDays(fullBreakdown, totalPayableDays, totalWorkingDays);

    await prisma.payslip.update({
      where: { id: payslip.id },
      data: {
        status: PayslipStatus.COMPUTED,
        attendanceDays,
        paidLeaveDays,
        unpaidLeaveDays,
        totalPayableDays,
        monthlyWage: fullBreakdown.monthlyWage,
        basicSalary: scaled.basicSalary,
        hra: scaled.hra,
        standardAllowance: scaled.standardAllowance,
        bonus: scaled.bonus,
        lta: scaled.lta,
        fixedAllowance: scaled.fixedAllowance,
        grossWage: scaled.grossWage,
        pfEmployee: scaled.pfEmployee,
        pfEmployer: scaled.pfEmployer,
        professionalTax: scaled.professionalTax,
        totalDeductions: scaled.totalDeductions,
        netWage: scaled.netWage,
        employerCost: scaled.employerCost,
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