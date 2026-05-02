"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function requestPasswordReset() {
  try {
    const userId = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return { success: false, error: "User not found" };

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Save token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl.replace(/\/+$/, "")}/reset-password?token=${token}`;

    const emailSent = await sendPasswordResetEmail({
      to: user.email,
      fullName: user.name,
      resetLink,
    });

    return { success: true, emailSent, fallbackLink: !emailSent ? resetLink : undefined };
  } catch (err) {
    console.error("Password reset request error:", err);
    return { success: false, error: "Something went wrong" };
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !newPassword || !confirmPassword) {
      return { success: false, error: "All fields are required" };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.used) {
      return { success: false, error: "Invalid or used token" };
    }

    if (resetToken.expiresAt < new Date()) {
      return { success: false, error: "Token has expired" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    return { success: true };
  } catch (err) {
    console.error("Reset password error:", err);
    return { success: false, error: "Something went wrong" };
  }
}
