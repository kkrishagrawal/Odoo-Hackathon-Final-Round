import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, requireRoles } from "@/lib/auth";
import { UserRole, PayslipStatus } from "@/lib/generated/prisma/client";

// POST /api/payrun/validate
// Body: { payrunId: string }
// Validates all payslips in the payrun
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

  await prisma.payslip.updateMany({
    where: { payrunId },
    data: { status: PayslipStatus.VALIDATED, validatedAt: new Date() },
  });
  await prisma.payrun.update({ where: { id: payrunId }, data: { status: PayslipStatus.VALIDATED } });

  return NextResponse.json({ success: true });
}
