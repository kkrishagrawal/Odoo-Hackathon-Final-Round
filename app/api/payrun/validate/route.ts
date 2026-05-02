// app/api/payrun/validate/route.ts
// POST { payrunId } → validates all COMPUTED payslips in a payrun

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getUser, requireRoles } from "@/lib/auth";
// import { UserRole } from "@/lib/generated/prisma/client";
import { PayslipStatus } from "@/lib/generated/prisma/client";

export async function POST(req: NextRequest) {
    // const user = await getUser(req);
    // const authError = requireRoles(user, [UserRole.ADMIN, UserRole.PAYROLL_OFFICER]);
    // if (authError) return authError;

    const { payrunId } = await req.json();
    if (!payrunId) {
        return NextResponse.json({ error: "payrunId required" }, { status: 400 });
    }

    const payrun = await prisma.payrun.findUnique({
        where: { id: payrunId },
        include: { payslips: true },
    });

    if (!payrun) {
        return NextResponse.json({ error: "Payrun not found" }, { status: 404 });
    }

    // Only validate payslips that have been computed
    const computedPayslips = payrun.payslips.filter(
        (p) => p.status === PayslipStatus.COMPUTED
    );

    if (computedPayslips.length === 0) {
        return NextResponse.json(
            { error: "No computed payslips to validate. Run Compute first." },
            { status: 400 }
        );
    }

    const now = new Date();

    await prisma.$transaction([
        // Validate all computed payslips
        prisma.payslip.updateMany({
            where: {
                payrunId,
                status: PayslipStatus.COMPUTED,
            },
            data: {
                status: PayslipStatus.VALIDATED,
                validatedAt: now,
            },
        }),
        // Mark the payrun itself as validated
        prisma.payrun.update({
            where: { id: payrunId },
            data: { status: PayslipStatus.VALIDATED },
        }),
    ]);

    return NextResponse.json({
        success: true,
        validatedCount: computedPayslips.length,
    });
}