import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST /api/attendance/checkout — Check out for today
export async function POST() {
  try {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!existing || !existing.checkIn) {
      return NextResponse.json({ error: "Not checked in today" }, { status: 400 });
    }

    if (existing.checkOut) {
      return NextResponse.json({ error: "Already checked out today", record: existing }, { status: 400 });
    }

    // Calculate work hours
    const diffMs = now.getTime() - new Date(existing.checkIn).getTime();
    const workHoursDecimal = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    const extraHours = parseFloat(Math.max(0, workHoursDecimal - 8).toFixed(2));

    const record = await prisma.attendance.update({
      where: { userId_date: { userId, date: today } },
      data: {
        checkOut: now,
        workHours: workHoursDecimal,
        extraHours: extraHours,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { status: "ABSENT" },
    });

    return NextResponse.json({ record });
  } catch (err) {
    console.error("Check-out error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
