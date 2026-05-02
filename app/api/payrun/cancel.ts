import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser, requireRoles } from "@/lib/auth";
import { UserRole, PayslipStatus } from "@/lib/generated/prisma/client";

// POST /api/payrun/cancel
// Body: { payrunId: string }
// Cancels a payrun and all its payslips
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
    data: { status: PayslipStatus.CANCELLED },
  });
  await prisma.payrun.update({ where: { id: payrunId }, data: { status: PayslipStatus.CANCELLED } });

  return NextResponse.json({ success: true });
}
