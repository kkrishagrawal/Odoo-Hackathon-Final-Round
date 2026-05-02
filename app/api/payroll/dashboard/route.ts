// GET /api/payroll/dashboard?chartView=monthly|annually
//
// Returns
//   - warnings        (missing bank a/c, missing manager)
//   - recentPayruns   (list with payslip count)
//   - chartData       (employer cost + employee count, monthly or annual)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getUser, requireRoles } from "@/lib/auth";
import { UserRole } from "@/lib/generated/prisma/client";
import { computeSalaryBreakdown } from "@/lib/payroll";

export async function GET(req: NextRequest) {
  // Auth guard
  // TODO: UNCOMMENT when JWT is ready:
  //
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
  // if (authError) return authError;
  // const companyId = user!.companyId;
  //
  // TODO: remove before production:
  const companyId = "REPLACE_WITH_REAL_COMPANY_ID";

  const { searchParams } = new URL(req.url);
  const chartView = searchParams.get("chartView") === "annually" ? "annually" : "monthly";

  // 1. Warnings
  const [missingBank, missingManager] = await Promise.all([
    prisma.user.count({
      where: {
        companyId,
        role: UserRole.EMPLOYEE,
        bankDetails: null,
      },
    }),
    prisma.user.count({
      where: {
        companyId,
        role: UserRole.EMPLOYEE,
        managerId: null,
      },
    }),
  ]);

  // 2. Recent Payruns (last 6)
  const payruns = await prisma.payrun.findMany({
    where: { companyId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 6,
    include: {
      _count: { select: { payslips: true } },
    },
  });

  const recentPayruns = payruns.map((p) => ({
    id: p.id,
    month: p.month,
    year: p.year,
    status: p.status,
    payslipCount: p._count.payslips,
  }));

  // 3. Chart Data
  // Employer cost = sum of all employees' (monthlyWage + pfEmployer) for a period
  // Employee count = distinct active employees with a payslip in that period

  let chartData: { label: string; employerCost: number; employeeCount: number }[] = [];

  if (chartView === "monthly") {
    // Last 12 months
    const now = new Date();
    const months: { month: number; year: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    chartData = await Promise.all(
      months.map(async ({ month, year }) => {
        const payslips = await prisma.payslip.findMany({
          where: {
            payrun: { companyId, month, year },
            status: { in: ["COMPUTED", "VALIDATED"] },
          },
          select: { employerCost: true },
        });

        const totalCost = payslips.reduce((sum, p) => sum + p.employerCost.toNumber(), 0);
        return {
          label: `${monthName(month)} ${year}`,
          employerCost: Math.round(totalCost),
          employeeCount: payslips.length,
        };
      })
    );
  } else {
    // Last 5 financial years (Apr–Mar)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i);

    chartData = await Promise.all(
      years.map(async (year) => {
        // Financial year: Apr year to Mar year+1
        const payslips = await prisma.payslip.findMany({
          where: {
            payrun: {
              companyId,
              OR: [
                { year, month: { gte: 4 } },
                { year: year + 1, month: { lte: 3 } },
              ],
            },
            status: { in: ["COMPUTED", "VALIDATED"] },
          },
          select: { employerCost: true, userId: true },
        });

        const totalCost = payslips.reduce((sum, p) => sum + p.employerCost.toNumber(), 0);
        const uniqueEmployees = new Set(payslips.map((p) => p.userId)).size;

        return {
          label: `FY ${year}-${String(year + 1).slice(2)}`,
          employerCost: Math.round(totalCost),
          employeeCount: uniqueEmployees,
        };
      })
    );
  }

  return NextResponse.json({
    warnings: {
      missingBank,
      missingManager,
    },
    recentPayruns,
    chartData,
    chartView,
  });
}

function monthName(month: number): string {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month - 1];
}