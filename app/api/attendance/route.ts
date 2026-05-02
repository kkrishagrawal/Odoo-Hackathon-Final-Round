import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET /api/attendance — Fetch attendance records
// Query params: mode ("my" | "all"), date (YYYY-MM-DD), from (YYYY-MM-DD), to (YYYY-MM-DD)
export async function GET(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const dateStr = searchParams.get("date"); // single date YYYY-MM-DD
    const fromStr = searchParams.get("from"); // range start YYYY-MM-DD
    const toStr = searchParams.get("to");     // range end YYYY-MM-DD
    const mode = searchParams.get("mode"); // "my" | "all"

    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { role: true, companyId: true },
    });
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    function parseDate(str: string): Date {
      const parts = str.split('-');
      if (parts.length === 3) {
        return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      }
      return new Date(str);
    }

    // Build the where clause
    const where: Record<string, unknown> = {};

    if (mode === "all" && sessionUser.role !== "EMPLOYEE") {
      // Admin/HR/Payroll viewing all employees of their company
      where.user = { companyId: sessionUser.companyId };
      
      if (fromStr && toStr) {
        // Date range filter
        const fromDate = parseDate(fromStr);
        const toDate = parseDate(toStr);
        where.date = { gte: fromDate, lte: toDate };
      } else if (dateStr) {
        where.date = parseDate(dateStr);
      }
    } else {
      // Employee viewing own records, or specific user
      where.userId = targetUserId || sessionUserId;
      
      if (fromStr && toStr) {
        const fromDate = parseDate(fromStr);
        const toDate = parseDate(toStr);
        where.date = { gte: fromDate, lte: toDate };
      } else if (dateStr) {
        where.date = parseDate(dateStr);
      }
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    // Also get today's record for the session user
    const today = new Date();
    const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const todayRecord = await prisma.attendance.findUnique({
      where: { userId_date: { userId: sessionUserId, date: todayDate } },
    });

    return NextResponse.json({ records, todayRecord });
  } catch (err) {
    console.error("GET /api/attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
