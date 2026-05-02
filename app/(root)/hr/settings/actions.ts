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
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function generatePassword(): string {
  const base = crypto.randomBytes(6).toString("base64url");
  return base.slice(0, 8) + "@1";
}

async function generateLoginId(
  companyId: string,
  loginPrefix: string,
  fullName: string,
  joiningYear: number
): Promise<{ loginId: string }> {
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const nameCode = (firstName.slice(0, 2) + lastName.slice(0, 2)).toUpperCase();

  const joiningSerial = await prisma.joiningSerial.upsert({
    where: { companyId_year: { companyId, year: joiningYear } },
    update: { lastSerial: { increment: 1 } },
    create: { companyId, year: joiningYear, lastSerial: 1 },
  });

  const paddedSerial = String(joiningSerial.lastSerial).padStart(4, "0");
  return { loginId: `${loginPrefix}${nameCode}${joiningYear}${paddedSerial}` };
}

// ─── Get current HR officer ──────────────────────────────────────────────────

async function getHrWithCompany() {
  const sessionUserId = await getSession();
  if (!sessionUserId) return null;

  const hr = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: { company: true },
  });

  if (!hr || hr.role !== "HR_OFFICER") return null;
  return hr;
}

// ─── Create Employee Action (HR — EMPLOYEE only) ─────────────────────────────

export async function createEmployee(formData: FormData): Promise<CreateEmployeeResult> {
  try {
    const hr = await getHrWithCompany();
    if (!hr) {
      return { success: false, error: "Unauthorized. HR Officer access required." };
    }

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!name || !email) {
      return { success: false, error: "Name and email are required." };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 12);
    const joiningYear = new Date().getFullYear();

    const { loginId } = await generateLoginId(
      hr.companyId,
      hr.company.loginPrefix,
      name,
      joiningYear
    );

    await prisma.user.create({
      data: {
        id: loginId,
        name,
        email,
        password: hashedPassword,
        role: "EMPLOYEE", // HR can only create employees
        companyId: hr.companyId,
        joiningYear,
        dateOfJoining: new Date(),
      },
    });

    const emailSent = await sendCredentialsEmail({
      to: email,
      fullName: name,
      companyName: hr.company.name,
      role: "Employee",
      temporaryPassword: rawPassword,
      loginId,
      createdBy: hr.name,
    });

    return { success: true, loginId, password: rawPassword, emailSent };
  } catch (err) {
    console.error("HR createEmployee error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── Resend Credentials (HR) ─────────────────────────────────────────────────

export async function resendCredentialsEmail(
  userId: string
): Promise<{ success: boolean; error?: string; emailSent?: boolean; password?: string }> {
  try {
    const hr = await getHrWithCompany();
    if (!hr) return { success: false, error: "Unauthorized." };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.companyId !== hr.companyId || user.role !== "EMPLOYEE") {
      return { success: false, error: "Employee not found." };
    }

    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    const emailSent = await sendCredentialsEmail({
      to: user.email,
      fullName: user.name,
      companyName: hr.company.name,
      role: "Employee",
      temporaryPassword: rawPassword,
      loginId: user.id,
      createdBy: hr.name,
    });

    return {
      success: true,
      emailSent,
      password: emailSent ? undefined : rawPassword,
    };
  } catch (err) {
    console.error("HR resendCredentialsEmail error:", err);
    return { success: false, error: "Something went wrong." };
  }
}

// ─── Get Company Employees (HR — EMPLOYEE role only) ─────────────────────────

export async function getCompanyEmployees(): Promise<EmployeeRow[]> {
  const hr = await getHrWithCompany();
  if (!hr) return [];

  const users = await prisma.user.findMany({
    where: {
      companyId: hr.companyId,
      role: "EMPLOYEE", // HR sees only employees
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));
}
