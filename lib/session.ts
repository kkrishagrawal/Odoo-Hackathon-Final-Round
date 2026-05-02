import { cookies } from "next/headers";

const SESSION_COOKIE = "session_user_id";

/**
 * Create a session by setting an httpOnly cookie with the user's ID.
 */
export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // 30 days
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Read the current session and return the userId, or null if not logged in.
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Destroy the session by deleting the cookie.
 */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
