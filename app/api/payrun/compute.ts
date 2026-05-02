import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, requireRoles } from "@/lib/auth";
import { UserRole, PayslipStatus } from "@/lib/generated/prisma/client";
import { computeSalaryBreakdown } from "@/lib/payroll";

// POST /api/payrun/compute
// Body: { payrunId: string }
// Computes all payslips in the payrun
export async function POST(req: NextRequest) {
  // TODO: Auth guard
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
  // if (authError) return authError;
  // const companyId = user!.companyId;
  const companyId = "cmoo5tzca00020cu1yq9v6fso";

  const { payrunId } = await req.json();
  if (!payrunId) {
    return NextResponse.json({ error: "payrunId required" }, { status: 400 });
  }

  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: {
      payslips: {
        include: {
          user: { include: { salaryInfo: true, attendanceRecords: true, timeOffRequests: true } },
        },
      },
    },
  });
  if (!payrun) return NextResponse.json({ error: "Payrun not found" }, { status: 404 });

  // Compute each payslip
  for (const payslip of payrun.payslips) {
    // Compute salary breakdown from salaryInfo
    const info = payslip.user.salaryInfo;
    if (!info) continue;
    const breakdown = computeSalaryBreakdown(info);
    await prisma.payslip.update({
      where: { id: payslip.id },
      data: {
        ...breakdown,
        status: PayslipStatus.COMPUTED,
      },
    });
  }

  await prisma.payrun.update({ where: { id: payrunId }, data: { status: PayslipStatus.COMPUTED } });

  return NextResponse.json({ success: true });
}
