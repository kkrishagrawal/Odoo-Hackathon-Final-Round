// GET /api/payroll/config        → fetch company payroll config
// PUT /api/payroll/config        → upsert company payroll config
//     body: { pfEmployeePct, pfEmployerPct, professionalTax }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getUser, requireRoles } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const companyId = "cmoo5tzca00020cu1yq9v6fso";

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
  const companyId = "cmoo5tzca00020cu1yq9v6fso";

  const body = await req.json();
  const data = {
    pfEmployeePct: parseFloat(body.pfEmployeePct) || 12,
    pfEmployerPct: parseFloat(body.pfEmployerPct) || 12,
    professionalTax: parseFloat(body.professionalTax) || 200,
  };

  const company = await prisma.company.update({
    where: { id: companyId },
    data,
  });

  return NextResponse.json({
    config: {
      pfEmployeePct: company.pfEmployeePct.toNumber(),
      pfEmployerPct: company.pfEmployerPct.toNumber(),
      professionalTax: company.professionalTax.toNumber(),
    },
  });

}