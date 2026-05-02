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
  if (payslip.status === PayslipStatus.VALIDATED)
    return NextResponse.json({ error: "Cannot cancel a validated payslip" }, { status: 400 });

  const updated = await prisma.payslip.update({
    where: { id: payslipId },
    data: { status: PayslipStatus.CANCELLED },
  });

  return NextResponse.json({ payslip: updated });
}