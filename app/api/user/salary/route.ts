// GET  /api/user/salary?userId=...   → fetch salary info for a user
// PUT  /api/user/salary              → upsert salary info for a user
//      body: { userId, monthlyWage, workingDaysPerWeek, breakTimeHrs,
//              basicSalaryPct, hraPct, standardAllowance, bonusPct, ltaPct,
//            }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getUser, requireRoles } from "@/lib/auth";
import { UserRole } from "@/lib/generated/prisma/client";

export async function GET(req: NextRequest) {
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
  // if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const salaryInfo = await prisma.salaryInfo.findUnique({ where: { userId } });
  return NextResponse.json({ salaryInfo });
}

export async function PUT(req: NextRequest) {
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
  // if (authError) return authError;

  const body = await req.json();
  const { userId, ...fields } = body;

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Parse all numeric fields safely
  const data = {
    monthlyWage: parseFloat(fields.monthlyWage) || 0,
    workingDaysPerWeek: parseInt(fields.workingDaysPerWeek) || 5,
    breakTimeHrs: parseFloat(fields.breakTimeHrs) || 1,
    basicSalaryPct: parseFloat(fields.basicSalaryPct) || 50,
    hraPct: parseFloat(fields.hraPct) || 50,
    standardAllowance: parseFloat(fields.standardAllowance) || 0,
    bonusPct: parseFloat(fields.bonusPct) || 8.33,
    ltaPct: parseFloat(fields.ltaPct) || 8.33,
    pfEmployeePctOverride:
      fields.pfEmployeePctOverride !== undefined
        ? Number(fields.pfEmployeePctOverride)
        : undefined,
  };

  if (
    data.pfEmployeePctOverride !== undefined &&
    (data.pfEmployeePctOverride < 12 ||
      data.pfEmployeePctOverride > 20)
  ) {
    return NextResponse.json(
      { error: "PF override must be between 12 and 20" },
      { status: 400 }
    );
  }

  const salaryInfo = await prisma.salaryInfo.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return NextResponse.json({ salaryInfo });
}