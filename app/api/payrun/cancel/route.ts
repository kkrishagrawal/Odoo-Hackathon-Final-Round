// POST { payrunId } → cancels all non-validated payslips in a payrun

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getUser, requireRoles } from "@/lib/auth";
// import { UserRole } from "@/lib/generated/prisma/client";
import { PayslipStatus } from "@/lib/generated/prisma/client";

export async function POST(req: NextRequest) {
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
  // if (authError) return authError;

  const { payrunId } = await req.json();
  if (!payrunId) {
    return NextResponse.json({ error: "payrunId required" }, { status: 400 });
  }

  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: { payslips: true },
  });

  if (!payrun) {
    return NextResponse.json({ error: "Payrun not found" }, { status: 404 });
  }

  // Block if any payslip is already validated
  const hasValidated = payrun.payslips.some(
    (p) => p.status === PayslipStatus.VALIDATED
  );
  if (hasValidated) {
    return NextResponse.json(
      { error: "Cannot cancel a payrun that has validated payslips" },
      { status: 400 }
    );
  }

  const cancellable = payrun.payslips.filter(
    (p) => p.status !== PayslipStatus.CANCELLED
  );

  await prisma.$transaction([
    prisma.payslip.updateMany({
      where: {
        payrunId,
        status: { not: PayslipStatus.CANCELLED },
      },
      data: { status: PayslipStatus.CANCELLED },
    }),
    prisma.payrun.update({
      where: { id: payrunId },
      data: { status: PayslipStatus.CANCELLED },
    }),
  ]);

  return NextResponse.json({
    success: true,
    cancelledCount: cancellable.length,
  });
}