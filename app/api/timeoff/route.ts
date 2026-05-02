import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET /api/timeoff — Fetch time-off requests
export async function GET(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessionUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { role: true, companyId: true },
    });
    if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode"); // "my" | "all"

    let requests;
    if (mode === "all" && sessionUser.role !== "EMPLOYEE") {
      // Admin/HR/Payroll see all company requests
      requests = await prisma.timeOffRequest.findMany({
        where: { user: { companyId: sessionUser.companyId } },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Employee sees only their own
      requests = await prisma.timeOffRequest.findMany({
        where: { userId: sessionUserId },
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      });
    }

    // Also compute stats for the current user
    const stats = await prisma.timeOffRequest.groupBy({
      by: ["type"],
      where: { userId: sessionUserId, status: "APPROVED" },
      _sum: { days: true },
    });

    return NextResponse.json({ requests, stats });
  } catch (err) {
    console.error("GET /api/timeoff error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/timeoff — Create a new time-off request
export async function POST(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, startDate, endDate, days, note } = body;

    if (!type || !startDate || !days) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Map frontend type to DB enum
    const typeMap: Record<string, "PAID" | "SICK" | "UNPAID"> = {
      "Paid leave": "PAID",
      "Sick leave": "SICK",
      "Unpaid leave": "UNPAID",
    };

    const dbType = typeMap[type];
    if (!dbType) {
      return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });
    }

    const request = await prisma.timeOffRequest.create({
      data: {
        userId: sessionUserId,
        type: dbType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        days: parseFloat(days),
        note: note || null,
        status: "PENDING",
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json({ request });
  } catch (err) {
    console.error("POST /api/timeoff error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
