import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/payroll/payslip/[payslipId]
// Returns payslip details for a given payslip id
export async function GET(req: NextRequest, { params }: { params: Promise<{ payslipId: string }> }) {
  // TODO: Auth guard
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER, UserRole.EMPLOYEE]);
  // if (authError) return authError;
  const { payslipId } = await params;
  if (!payslipId) return NextResponse.json({ error: "Payslip id required" }, { status: 400 });

  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      user: {
        include: { bankDetails: true, salaryInfo: true },
        select: {
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
