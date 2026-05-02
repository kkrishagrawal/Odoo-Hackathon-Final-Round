import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

interface BreakEntry {
  pausedAt: string;
  resumedAt: string | null;
}

// POST /api/attendance/unpause — Resume the current work session
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

    // Check if actually paused
    if (breaks.length === 0 || breaks[breaks.length - 1].resumedAt !== null) {
      return NextResponse.json({ error: "Not currently paused", record: existing }, { status: 400 });
    }

    // Set resumedAt on the last break entry
    breaks[breaks.length - 1].resumedAt = now.toISOString();

    const record = await prisma.attendance.update({
      where: { userId_date: { userId, date: today } },
      data: {
        breaks: breaks as any,
      },
    });

    return NextResponse.json({ record });
  } catch (err) {
    console.error("Unpause error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
