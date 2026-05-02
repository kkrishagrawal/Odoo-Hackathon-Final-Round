import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PayslipStatus } from "@/lib/generated/prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ payslipId: string }> }
) {
  const { payslipId } = await params;

  const payslip = await prisma.payslip.findUnique({ where: { id: payslipId } });
  if (!payslip) return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
  if (payslip.status !== PayslipStatus.COMPUTED)
    return NextResponse.json({ error: "Payslip must be computed before validating" }, { status: 400 });

  const updated = await prisma.payslip.update({
    where: { id: payslipId },
    data: { status: PayslipStatus.VALIDATED, validatedAt: new Date() },
  });

  return NextResponse.json({ payslip: updated });
}