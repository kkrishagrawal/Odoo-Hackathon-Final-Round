"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendCredentialsEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────

export type CreateEmployeeResult = {
  success: boolean;
  error?: string;
  loginId?: string;
  password?: string;
  emailSent?: boolean;
};

export type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  emailSent: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a random 10-char password */
function generatePassword(): string {
  // 6 random bytes → 8 chars base64, then add some special chars
  const base = crypto.randomBytes(6).toString("base64url");
  return base.slice(0, 8) + "@1";
}

/**
 * Generate a Login ID for a new employee in the admin's company.
 * Uses the company's loginPrefix and increments the serial for that company+year.
 */
async function generateLoginId(
  companyId: string,
  loginPrefix: string,
  fullName: string,
  joiningYear: number
): Promise<{ loginId: string; serial: number }> {
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const nameCode =
    (firstName.slice(0, 2) + lastName.slice(0, 2)).toUpperCase();

  // Atomically get-or-create + increment serial for this company+year
  const joiningSerial = await prisma.joiningSerial.upsert({
    where: {
      companyId_year: { companyId, year: joiningYear },
    },
    update: {
      lastSerial: { increment: 1 },
    },
    create: {
      companyId,
      year: joiningYear,
      lastSerial: 1,
    },
  });

  const serial = joiningSerial.lastSerial;
  const paddedSerial = String(serial).padStart(4, "0");

  const loginId = `${loginPrefix}${nameCode}${joiningYear}${paddedSerial}`;
  return { loginId, serial };
}

// ─── Get current admin info ─────────────────────────────────────────────────

async function getAdminWithCompany() {
  const sessionUserId = await getSession();
  if (!sessionUserId) return null;

  const admin = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { company: true },
  });

  if (!admin || admin.role !== "ADMIN") return null;
  return admin;
}

// ─── Create Employee Action ─────────────────────────────────────────────────

export async function createEmployee(formData: FormData): Promise<CreateEmployeeResult> {
  try {
    const admin = await getAdminWithCompany();
    if (!admin) {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const role = (formData.get("role") as string)?.trim();

    // Validation
    if (!name || !email || !role) {
      return { success: false, error: "Name, email, and role are required." };
    }

    const validRoles = ["EMPLOYEE", "HR_OFFICER", "PAYROLL_OFFICER"];
    if (!validRoles.includes(role)) {
      return { success: false, error: "Invalid role selected." };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    // Generate password and login ID
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 12);
    const joiningYear = new Date().getFullYear();

    const { loginId } = await generateLoginId(
      admin.companyId,
      admin.company.loginPrefix,
      name,
      joiningYear
    );

    // Create user in the admin's company
    await prisma.user.create({
      data: {
        id: loginId,
        name,
        email,
        password: hashedPassword,
        role: role as "EMPLOYEE" | "HR_OFFICER" | "PAYROLL_OFFICER",
        companyId: admin.companyId,
        joiningYear,
        dateOfJoining: new Date(),
      },
    });

    // Send credentials email — returns false if SMTP falls back to JSON transport
    const emailSent = await sendCredentialsEmail({
      to: email,
      fullName: name,
      companyName: admin.company.name,
      role,
      temporaryPassword: rawPassword,
      loginId,
      createdBy: admin.name,
    });

    return { success: true, loginId, password: rawPassword, emailSent };
  } catch (err) {
    console.error("Create employee error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── Send Credentials Email (resend) ────────────────────────────────────────

export async function resendCredentialsEmail(userId: string): Promise<{ success: boolean; error?: string; emailSent?: boolean; password?: string }> {
  try {
    const admin = await getAdminWithCompany();
    if (!admin) {
      return { success: false, error: "Unauthorized." };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.companyId !== admin.companyId) {
      return { success: false, error: "User not found." };
    }

    // Generate a new password for the user
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    const emailSent = await sendCredentialsEmail({
      to: user.email,
      fullName: user.name,
      companyName: admin.company.name,
      role: user.role,
      temporaryPassword: rawPassword,
      loginId: user.id,
      createdBy: admin.name,
    });

    // Password was reset successfully regardless of email outcome
    return {
      success: true,
      emailSent,
      password: emailSent ? undefined : rawPassword,
    };
  } catch (err) {
    console.error("Resend error:", err);
    return { success: false, error: "Something went wrong." };
  }
}

// ─── Get Company Employees ──────────────────────────────────────────────────

export async function getCompanyEmployees(): Promise<EmployeeRow[]> {
  const admin = await getAdminWithCompany();
  if (!admin) return [];

  const users = await prisma.user.findMany({
    where: {
      companyId: admin.companyId,
      id: { not: admin.id }, // exclude the admin themselves
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    emailSent: true, // email is sent on creation
  }));
}
