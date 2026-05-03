import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/generated/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const year = Number(searchParams.get("year"));

    if (!userId || !year) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const payslips = await prisma.payslip.findMany({
      where: {
        userId,
        status: "VALIDATED",
        payrun: {
          year,
        },
      },
      include: {
        payrun: true,
        user: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        payrun: {
          month: "asc",
        },
      },
    });

    if (!payslips.length) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const sum = (key: keyof (typeof payslips)[number]) =>
      payslips.reduce((acc, p) => acc + Number(p[key] || 0), 0);

    const months = payslips.length;

    const report = {
      companyName: payslips[0].user.company.name,
      employeeName: payslips[0].user.name,
      designation: payslips[0].user.jobPosition,
      dateOfJoining: payslips[0].user.dateOfJoining,
      year,

      months,

      earnings: {
        basic: sum("basicSalary"),
        hra: sum("hra"),
        standardAllowance: sum("standardAllowance"),
        bonus: sum("bonus"),
        lta: sum("lta"),
        fixedAllowance: sum("fixedAllowance"),
      },

      deductions: {
        pfEmployee: sum("pfEmployee"),
        professionalTax: sum("professionalTax"),
        tds: sum("tdsDeduction"),
      },

      totals: {
        gross: sum("grossWage"),
        deductions: sum("totalDeductions"),
        net: sum("netWage"),
      },
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}