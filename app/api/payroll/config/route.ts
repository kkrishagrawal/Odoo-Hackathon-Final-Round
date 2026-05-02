// GET /api/payroll/config        → fetch company payroll config
// PUT /api/payroll/config        → upsert company payroll config
//     body: { pfEmployeePct, pfEmployerPct, professionalTax }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getUser, requireRoles } from "@/lib/auth";
import { UserRole } from "@/lib/generated/prisma/client";

export async function GET(req: NextRequest) {
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
  // if (authError) return authError;
  // const companyId = user!.companyId;
  const companyId = "REPLACE_WITH_REAL_COMPANY_ID";

  const config = await prisma.payrollConfig.findUnique({ where: { companyId } });

  // Return defaults if not configured yet
  return NextResponse.json({
    config: config
      ? {
          pfEmployeePct: config.pfEmployeePct.toNumber(),
          pfEmployerPct: config.pfEmployerPct.toNumber(),
          professionalTax: config.professionalTax.toNumber(),
        }
      : { pfEmployeePct: 12, pfEmployerPct: 12, professionalTax: 200 },
  });
}

export async function PUT(req: NextRequest) {
  // const user = await getUser(req);
  // const authError = requireRoles(user, [UserRole.ADMIN]);  // Admin only
  // if (authError) return authError;
  // const companyId = user!.companyId;
  const companyId = "REPLACE_WITH_REAL_COMPANY_ID";

  const body = await req.json();
  const data = {
    pfEmployeePct: parseFloat(body.pfEmployeePct) || 12,
    pfEmployerPct: parseFloat(body.pfEmployerPct) || 12,
    professionalTax: parseFloat(body.professionalTax) || 200,
  };

  const config = await prisma.payrollConfig.upsert({
    where: { companyId },
    update: data,
    create: { companyId, ...data },
  });

  return NextResponse.json({
    config: {
      pfEmployeePct: config.pfEmployeePct.toNumber(),
      pfEmployerPct: config.pfEmployerPct.toNumber(),
      professionalTax: config.professionalTax.toNumber(),
    },
  });
}