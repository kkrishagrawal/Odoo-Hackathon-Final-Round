import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

interface BreakEntry {
  pausedAt: string;
  resumedAt: string | null;
}

// POST /api/attendance/pause — Pause the current work session
export async function POST() {
  try {
    const userId = await getSession();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!existing || !existing.checkIn) {
      return NextResponse.json({ error: "Not checked in today" }, { status: 400 });
    }

    if (existing.checkOut) {
      return NextResponse.json({ error: "Already checked out" }, { status: 400 });
    }

    const breaks = (existing.breaks as unknown as BreakEntry[]) || [];

    // Check if already paused (last break has no resumedAt)
    if (breaks.length > 0 && breaks[breaks.length - 1].resumedAt === null) {
      return NextResponse.json({ error: "Already paused", record: existing }, { status: 400 });
    }

    // Calculate worked hours since last resume (or check-in) and add to existing workHours
    const lastResumeTime = breaks.length > 0 && breaks[breaks.length - 1].resumedAt
      ? new Date(breaks[breaks.length - 1].resumedAt!).getTime()
      : new Date(existing.checkIn).getTime();

    const currentSegmentHrs = (now.getTime() - lastResumeTime) / (1000 * 60 * 60);
    const totalWorkHours = parseFloat(((Number(existing.workHours) || 0) + currentSegmentHrs).toFixed(2));

    // Add new break entry
    breaks.push({ pausedAt: now.toISOString(), resumedAt: null });

    const record = await prisma.attendance.update({
      where: { userId_date: { userId, date: today } },
      data: {
        breaks: breaks as any,
        workHours: totalWorkHours,
      },
    });

    return NextResponse.json({ record });
  } catch (err) {
    console.error("Pause error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
