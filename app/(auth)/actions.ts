"use server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import bcrypt from "bcryptjs";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Derive a login prefix from the company name.
 * Takes the first letter of each word, uppercased, up to 4 characters.
 * e.g. "Odoo India" → "OI", "Tech Solutions Private Limited" → "TSPL"
 */
function deriveLoginPrefix(companyName: string): string {
  return companyName
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
}

/**
 * Generate the Login ID for a new user.
 * Format: [CompanyPrefix][First2 of firstName + First2 of lastName][Year][4-digit serial]
 * Example: OIJODO20220001
 */
async function generateLoginId(
  companyId: string,
  loginPrefix: string,
  fullName: string,
  joiningYear: number
): Promise<{ loginId: string; serial: number }> {
  // Split name into parts
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  // First 2 letters of first and last name, uppercased
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

// ─── Types ──────────────────────────────────────────────────────────────────

export type AuthResult = {
  success: boolean;
  error?: string;
  loginId?: string;
  role?: string;
};

// ─── Signup Action ──────────────────────────────────────────────────────────

export async function signup(formData: FormData): Promise<AuthResult> {
  try {
    const companyName = (formData.get("companyName") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const phone = (formData.get("phone") as string)?.trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const logoUrl = (formData.get("logoUrl") as string) || null;

    // Validation
    if (!companyName || !name || !email || !password || !confirmPassword) {
      return { success: false, error: "All required fields must be filled." };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters.",
      };
    }

    if (password !== confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Derive login prefix from company name
    const loginPrefix = deriveLoginPrefix(companyName);
    const joiningYear = new Date().getFullYear();

    // Create Company
    const company = await prisma.company.create({
      data: {
        name: companyName,
        logoUrl,
        loginPrefix,
      },
    });

    // Generate Login ID
    const { loginId, serial } = await generateLoginId(
      company.id,
      loginPrefix,
      name,
      joiningYear
    );

    // Create User (ADMIN role — first user of the company)
    await prisma.user.create({
      data: {
        id: loginId,
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: "ADMIN",
        companyId: company.id,
        joiningYear,
        dateOfJoining: new Date(),
      },
    });

    // Create session
    await createSession(loginId);

    return { success: true, loginId, role: "ADMIN" };
  } catch (err) {
    console.error("Signup error:", err);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

// ─── Login Action ───────────────────────────────────────────────────────────

export async function login(formData: FormData): Promise<AuthResult> {
  try {
    const loginIdOrEmail = (formData.get("loginIdOrEmail") as string)?.trim();
    const password = formData.get("password") as string;

    if (!loginIdOrEmail || !password) {
      return { success: false, error: "Login ID/Email and password are required." };
    }

    // Try finding by Login ID first, then by email
    let user = await prisma.user.findUnique({
      where: { id: loginIdOrEmail },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: loginIdOrEmail.toLowerCase() },
      });
    }

    if (!user) {
      return { success: false, error: "Invalid credentials." };
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return { success: false, error: "Invalid credentials." };
    }

    // Create session
    await createSession(user.id);

    return { success: true, loginId: user.id, role: user.role };
  } catch (err) {
    console.error("Login error:", err);
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}
