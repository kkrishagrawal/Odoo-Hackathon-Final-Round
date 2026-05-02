import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST /api/user/certifications — Add a certification
export async function POST(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, issuer, year, userId } = body;

    const targetUserId = userId || sessionUserId;

    // If updating another user, check permissions
    if (targetUserId !== sessionUserId) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { role: true, companyId: true },
      });
      if (!sessionUser || sessionUser.role === "EMPLOYEE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Certification name is required" }, { status: 400 });
    }

    const certification = await prisma.certification.create({
      data: {
        userId: targetUserId,
        name: name.trim(),
        issuer: issuer ? issuer.trim() : null,
        year: year ? parseInt(year, 10) : null,
      },
    });

    return NextResponse.json({ certification });
  } catch (err) {
    console.error("POST /api/user/certifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/user/certifications — Remove a certification by id
export async function DELETE(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const certId = searchParams.get("id");

    if (!certId) return NextResponse.json({ error: "Certification ID required" }, { status: 400 });

    const cert = await prisma.certification.findUnique({
      where: { id: certId },
      select: { userId: true },
    });

    if (!cert) return NextResponse.json({ error: "Certification not found" }, { status: 404 });

    // Check permissions
    if (cert.userId !== sessionUserId) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { role: true },
      });
      if (!sessionUser || sessionUser.role === "EMPLOYEE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.certification.delete({ where: { id: certId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/user/certifications error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
