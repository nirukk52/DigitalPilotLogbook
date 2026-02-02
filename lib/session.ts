/**
 * Session management for anonymous users
 * Creates a unique userId per browser session stored in cookies
 * This allows each visitor to have their own onboarding state
 */
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE_NAME = "pilot_logbook_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Get existing session userId from cookies (read-only)
 * Returns null if no session exists - use in Server Components
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const existingSession = cookieStore.get(SESSION_COOKIE_NAME);
  return existingSession?.value || null;
}

/**
 * Create a new session and return the userId
 * Must be called from a Server Action or Route Handler
 */
export async function createSession(): Promise<string> {
  const cookieStore = await cookies();
  const newUserId = uuidv4();
  cookieStore.set(SESSION_COOKIE_NAME, newUserId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return newUserId;
}

/**
 * Clear the session (useful for testing or logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
