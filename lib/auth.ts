//   3. When you implement login, sign a token with this shape:
//        { id: string, role: UserRole, companyId: string, name: string }
//      using:  new SignJWT(payload).setProtectedHeader({ alg: "HS256" })
//                .setExpirationTime("8h").sign(secret)
//   4. Store the token in an httpOnly cookie named "token"
//      (or Authorization header — see getUser below for both)

import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { UserRole } from "@/lib/generated/prisma/client";

export interface JWTPayload {
  id: string;
  role: UserRole;
  companyId: string;
  name: string;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set in environment variables");
  return new TextEncoder().encode(secret);
}

/**
 * Extract and verify the JWT from the request.
 * Checks httpOnly cookie "token" first, then Authorization header.
 * Returns null if missing or invalid — caller decides how to respond.
 */
export async function getUser(req: NextRequest): Promise<JWTPayload | null> {
  try {
    // Try cookie first (recommended for web)
    const cookieToken = req.cookies.get("token")?.value;
    // Fallback: Authorization: Bearer <token>
    const headerToken = req.headers.get("authorization")?.replace("Bearer ", "");

    const token = cookieToken ?? headerToken;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** Throws a Response if user is missing or doesn't have required role */
export function requireRoles(user: JWTPayload | null, roles: UserRole[]): Response | null {
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!roles.includes(user.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }
  return null;
}