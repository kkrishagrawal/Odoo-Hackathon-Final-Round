import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/payroll/payslip/[payslipId]
// Returns payslip details for a given payslip id
export async function GET(req: NextRequest, { params }: { params: Promise<{ payslipId: string }> }) {
  const { payslipId } = await params;
  if (!payslipId) return NextResponse.json({ error: "Payslip id required" }, { status: 400 });

  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      user: {
        include: { bankDetails: true, salaryInfo: true ,
          company: {
            select: { name: true, logoUrl: true }
          },
        }
      },
      payrun: true,
    },
  });
  if (!payslip) return NextResponse.json({ error: "Payslip not found" }, { status: 404 });

  return NextResponse.json({ payslip });
}
