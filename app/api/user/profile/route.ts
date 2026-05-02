import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const sessionUserId = await getSession();
    if (!sessionUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, ...data } = body;

    // Determine which user to update
    const targetUserId = userId || sessionUserId;

    // If updating another user, check that session user is ADMIN / HR / PAYROLL
    if (targetUserId !== sessionUserId) {
      const sessionUser = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { role: true, companyId: true },
      });
      if (!sessionUser || sessionUser.role === "EMPLOYEE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Also verify same company
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { companyId: true },
      });
      if (!targetUser || targetUser.companyId !== sessionUser.companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Extract bank details separately
    const { bankDetails, ...userData } = data;

    // Whitelist fields allowed for update
    const allowedUserFields = [
      "name", "email", "personalEmail", "phone", "department",
      "jobPosition", "location", "managerId", "dateOfBirth",
      "residingAddress", "nationality", "gender", "maritalStatus",
      "dateOfJoining", "about", "whatILove", "interests", "profilePicUrl",
    ];

    const userUpdate: Record<string, unknown> = {};
    for (const key of allowedUserFields) {
      if (key in userData && userData[key] !== undefined) {
        // Handle date fields
        if (["dateOfBirth", "dateOfJoining"].includes(key) && userData[key]) {
          userUpdate[key] = new Date(userData[key] as string);
        } else {
          userUpdate[key] = userData[key];
        }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: userUpdate,
      include: {
        company: true,
        bankDetails: true,
        salaryInfo: true,
        skills: true,
        certifications: true,
      },
    });

    // Update or create bank details if provided
    if (bankDetails && typeof bankDetails === "object") {
      const bankFields = ["accountNumber", "bankName", "ifscCode", "panNumber", "uanNumber", "employeeCode"];
      const bankUpdate: Record<string, string> = {};
      for (const key of bankFields) {
        if (key in bankDetails && bankDetails[key] !== undefined) {
          bankUpdate[key] = bankDetails[key] as string;
        }
      }

      if (Object.keys(bankUpdate).length > 0) {
        await prisma.bankDetails.upsert({
          where: { userId: targetUserId },
          update: bankUpdate,
          create: {
            userId: targetUserId,
            accountNumber: bankUpdate.accountNumber || "",
            bankName: bankUpdate.bankName || "",
            ifscCode: bankUpdate.ifscCode || "",
            panNumber: bankUpdate.panNumber || "",
            uanNumber: bankUpdate.uanNumber || null,
            employeeCode: bankUpdate.employeeCode || null,
          },
        });
      }
    }

    // Re-fetch with updated bank details
    const finalUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        company: true,
        bankDetails: true,
        salaryInfo: true,
        skills: true,
        certifications: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = finalUser!;

    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error("PUT /api/user/profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
