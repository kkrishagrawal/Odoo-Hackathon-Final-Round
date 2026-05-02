import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST /api/user/skills — Add skills (comma-separated)
export async function POST(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { skills, userId } = body; // skills: string (comma-separated), userId: optional

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

    if (!skills || typeof skills !== "string") {
      return NextResponse.json({ error: "Skills must be a comma-separated string" }, { status: 400 });
    }

    // Parse comma-separated skills
    const skillNames = skills
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    if (skillNames.length === 0) {
      return NextResponse.json({ error: "No valid skills provided" }, { status: 400 });
    }

    // Get existing skills to avoid duplicates
    const existing = await prisma.skill.findMany({
      where: { userId: targetUserId },
      select: { name: true },
    });
    const existingNames = new Set(existing.map(s => s.name.toLowerCase()));

    // Only create new ones
    const newSkills = skillNames.filter((name: string) => !existingNames.has(name.toLowerCase()));

    if (newSkills.length > 0) {
      await prisma.skill.createMany({
        data: newSkills.map((name: string) => ({ userId: targetUserId, name })),
      });
    }

    // Return updated skills
    const allSkills = await prisma.skill.findMany({
      where: { userId: targetUserId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ skills: allSkills, added: newSkills.length, skipped: skillNames.length - newSkills.length });
  } catch (err) {
    console.error("POST /api/user/skills error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/user/skills — Remove a skill by id
export async function DELETE(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const skillId = searchParams.get("id");

    if (!skillId) return NextResponse.json({ error: "Skill ID required" }, { status: 400 });

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: { userId: true },
    });

    if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

    // Check permissions
    if (skill.userId !== sessionUserId) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { role: true },
      });
      if (!sessionUser || sessionUser.role === "EMPLOYEE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.skill.delete({ where: { id: skillId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/user/skills error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
