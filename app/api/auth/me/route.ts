import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getSession();
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        bankDetails: true,
        salaryInfo: true,
        skills: true,
        certifications: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    // Don't send password hash to the client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json(
      { user: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
