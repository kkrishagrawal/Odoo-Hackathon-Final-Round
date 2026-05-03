import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole, PayslipStatus } from "@/lib/generated/prisma/client";

// POST /api/payrun/generate
// Body: { month: number, year: number }
// Generates a payrun for the given month/year for all employees in the company
export async function POST(req: NextRequest) {
  // TODO: Auth guard
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
  // if (authError) return authError;
  // const companyId = user!.companyId;
  const companyId = req.headers.get("x-company-id") || "cmoo5tzca00020cu1yq9v6fso";

  const { month, year } = await req.json();
  if (!month || !year) {
    return NextResponse.json({ error: "Month and year required" }, { status: 400 });
  }

  // Check if payrun already exists
  const existing = await prisma.payrun.findUnique({
    where: { companyId_month_year: { companyId, month, year }}, include: { payslips: true },
  });
  if (existing) {
    return NextResponse.json({ payrun: existing, alreadyExists: true, });
  }

  // Get all employees
  const employees = await prisma.user.findMany({
    where: { companyId, role: UserRole.EMPLOYEE },
    include: { salaryInfo: true },
  });

  // Create payrun and payslips (DRAFT)
  const payrun = await prisma.payrun.create({
    data: {
      companyId,
      month,
      year,
      status: PayslipStatus.DRAFT,
      payslips: {
        create: employees.map((emp) => ({
          userId: emp.id,
          monthlyWage: emp.salaryInfo?.monthlyWage || 0,
          basicSalary: 0,
          hra: 0,
          standardAllowance: 0,
          bonus: 0,
          lta: 0,
          fixedAllowance: 0,
          grossWage: 0,
          pfEmployee: 0,
          pfEmployer: 0,
          professionalTax: 0,
          totalDeductions: 0,
          netWage: 0,
          employerCost: 0,
          attendanceDays: 0,
          paidLeaveDays: 0,
          unpaidLeaveDays: 0,
          totalPayableDays: 0,
        })),
      },
    },
    include: { payslips: true },
  });

  return NextResponse.json({
    payrun,
    alreadyExists: false,
  });
}
