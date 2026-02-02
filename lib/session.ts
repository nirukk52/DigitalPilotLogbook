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
 * Get or create a session userId from cookies
 * Returns unique userId for this browser session
 */
export async function getSessionUserId(): Promise<string> {
  const cookieStore = await cookies();
  const existingSession = cookieStore.get(SESSION_COOKIE_NAME);

  if (existingSession?.value) {
    return existingSession.value;
  }

  // Create new session
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
