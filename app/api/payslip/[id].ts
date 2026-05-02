import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/payslip/[id]
// Returns payslip details for a given payslip id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Auth guard
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.EMPLOYEE]);
  // if (authError) return authError;
  const payslipId = params.id;
  if (!payslipId) return NextResponse.json({ error: "Payslip id required" }, { status: 400 });

  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      user: { include: { bankDetails: true, salaryInfo: true } },
      payrun: true,
    },
  });
  if (!payslip) return NextResponse.json({ error: "Payslip not found" }, { status: 404 });

  return NextResponse.json(payslip);
}
