// GET /api/payroll/config        → fetch company payroll config
// PUT /api/payroll/config        → upsert company payroll config
//     body: { pfEmployeePct, pfEmployerPct, professionalTax }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getUser, requireRoles } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
  // if (authError) return authError;
  // const companyId = user!.companyId;
  const companyId = req.headers.get("x-company-id") || "cmoo5tzca00020cu1yq9v6fso";

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { pfEmployeePct: true, pfEmployerPct: true, professionalTax: true },
  });

  return NextResponse.json({
    config: company
      ? {
        pfEmployeePct: company.pfEmployeePct.toNumber(),
        pfEmployerPct: company.pfEmployerPct.toNumber(),
        professionalTax: company.professionalTax.toNumber(),
      }
      : { pfEmployeePct: 12, pfEmployerPct: 12, professionalTax: 200 },
  });

}

export async function PUT(req: NextRequest) {
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN]);  // Admin only
  // if (authError) return authError;
  // const companyId = user!.companyId;
  const companyId = req.headers.get("x-company-id") || "cmoo5tzca00020cu1yq9v6fso";

  try {
    const body = await req.json();

    const pfEmployeePct = Number(body.pfEmployeePct);
    const pfEmployerPct = Number(body.pfEmployerPct);
    const professionalTax = Number(body.professionalTax);

    if (
      Number.isNaN(pfEmployeePct) ||
      Number.isNaN(pfEmployerPct) ||
      Number.isNaN(professionalTax)
    ) {
      return NextResponse.json(
        { error: "All values must be valid numbers" },
        { status: 400 }
      );
    }

    if (
      pfEmployeePct < 12 ||
      pfEmployeePct > 20 ||
      pfEmployerPct < 12 ||
      pfEmployerPct > 20
    ) {
      return NextResponse.json(
        { error: "PF percentage must be between 12 and 20" },
        { status: 400 }
      );
    }

    if (professionalTax < 0) {
      return NextResponse.json(
        { error: "Professional tax cannot be negative" },
        { status: 400 }
      );
    }

    const exists = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { pfEmployeePct, pfEmployerPct, professionalTax },
    });

    return NextResponse.json({
      config: {
        pfEmployeePct: company.pfEmployeePct.toNumber(),
        pfEmployerPct: company.pfEmployerPct.toNumber(),
        professionalTax: company.professionalTax.toNumber(),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}