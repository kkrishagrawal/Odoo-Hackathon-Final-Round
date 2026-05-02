import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params;

    // Verify the requesting user has permission (same company, not EMPLOYEE role)
    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { role: true, companyId: true },
    });

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Employees can only view their own profile
    if (sessionUser.role === "EMPLOYEE" && targetUserId !== sessionUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        company: true,
        bankDetails: true,
        salaryInfo: true,
        skills: true,
        certifications: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify same company
    if (targetUser.companyId !== sessionUser.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = targetUser;

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("GET /api/user/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
