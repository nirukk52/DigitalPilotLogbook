/**
 * Session management for anonymous users - READ ONLY
 * Cookie creation is handled by middleware.ts
 * This module only reads the session cookie
 */
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "pilot_logbook_session";

/**
 * Get the session userId from cookies (read-only)
 * The session is guaranteed to exist because middleware creates it
 * Returns the userId string, or null if somehow missing
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value || null;
}

/**
 * Clear the session cookie (for testing/logout purposes)
 * Note: This should only be called from Server Actions or Route Handlers
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
