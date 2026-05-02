import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET /api/attendance — Fetch attendance records
// Query params: userId (optional, for own records), companyId (optional), date (optional)
export async function GET(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const mode = searchParams.get("mode"); // "my" | "all"

    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { role: true, companyId: true },
    });
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Build the where clause
    const where: Record<string, unknown> = {};

    if (mode === "all" && sessionUser.role !== "EMPLOYEE") {
      // Admin/HR/Payroll viewing all employees of their company
      where.user = { companyId: sessionUser.companyId };
      if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          where.date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          where.date = new Date(dateStr);
        }
      }
    } else {
      // Employee viewing own records, or specific user
      where.userId = targetUserId || sessionUserId;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    // Also get today's record for the session user
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayRecord = await prisma.attendance.findUnique({
      where: { userId_date: { userId: sessionUserId, date: todayDate } },
    });

    return NextResponse.json({ records, todayRecord });
  } catch (err) {
    console.error("GET /api/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
