/**
 * Next.js Proxy (formerly Middleware) for anonymous session management
 * Creates a unique session cookie on first visit - this is the ONLY place
 * where the session cookie is created (proxy CAN set cookies)
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "pilot_logbook_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Generate a UUID v4 for anonymous session identification
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Check if session cookie already exists
  const existingSession = request.cookies.get(SESSION_COOKIE_NAME);

  if (!existingSession) {
    // Create new anonymous session
    const sessionId = generateUUID();
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }

  return response;
}

// Run middleware on all routes except static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (landing.html, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
