import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST /api/attendance/checkin — Check in for today
export async function POST() {
  try {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if already checked in today
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already checked in today", record: existing }, { status: 400 });
    }

    const record = await prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkIn: now,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { status: "IN_OFFICE" },
    });

    return NextResponse.json({ record });
  } catch (err) {
    console.error("Check-in error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
