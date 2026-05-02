import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the company ID from query params, or fall back to the session user's company
    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get("companyId");

    if (!companyId) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { companyId: true },
      });
      if (!sessionUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      companyId = sessionUser.companyId;
    }

    // Verify the requesting user belongs to the same company
    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { companyId: true },
    });
    if (!sessionUser || sessionUser.companyId !== companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const employees = await prisma.user.findMany({
      where: { companyId },
      // select: {
      //   id: true,
      //   name: true,
      //   email: true,
      //   role: true,
      //   department: true,
      //   jobPosition: true,
      //   status: true,
      //   profilePicUrl: true,
      // },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (err) {
    console.error("GET /api/employees error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
