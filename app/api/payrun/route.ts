import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));
  const companyId = "cmoo5tzca00020cu1yq9v6fso";

  if (!month || !year) {
    return NextResponse.json(
      { error: "Month and year required" },
      { status: 400 }
    );
  }

  const payrun = await prisma.payrun.findUnique({
    where: {
      companyId_month_year: { companyId, month, year },
    },
    include: {
      payslips: {
        include: { user: true },
      },
    },
  });

  return NextResponse.json(payrun);
}