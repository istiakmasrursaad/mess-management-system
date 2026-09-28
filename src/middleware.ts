import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/member": ["MEMBER"],
};

/** Add no-cache headers to a response so browsers never cache protected pages */
function withNoCache(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is protected
  const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  );

  if (!matchedRoute) {
    // Not a protected route — allow through
    return NextResponse.next();
  }

  // Read session cookie
  const sessionCookie = request.cookies.get("mess_session");

  // No session at all → redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("reason", "unauthenticated");
    return withNoCache(NextResponse.redirect(loginUrl));
  }

  // Try parsing session
  let session: { userId: string; role: string; name: string } | null = null;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    // Malformed cookie → clear it and redirect
    const loginUrl = new URL("/", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("mess_session");
    return withNoCache(response);
  }

  if (!session || !session.role) {
    const loginUrl = new URL("/", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("mess_session");
    return withNoCache(response);
  }

  // Check role is allowed for this route
  const allowedRoles = PROTECTED_ROUTES[matchedRoute];
  if (!allowedRoles.includes(session.role)) {
    // Wrong role — redirect to the correct page for their role
    if (session.role === "MEMBER") {
      return withNoCache(NextResponse.redirect(new URL("/member", request.url)));
    }
    if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
      return withNoCache(NextResponse.redirect(new URL("/admin", request.url)));
    }
    // Unknown role → kick to login
    const loginUrl = new URL("/", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("mess_session");
    return withNoCache(response);
  }

  // All checks passed — allow through, but still prevent caching
  return withNoCache(NextResponse.next());
}

// Apply middleware only to these paths
export const config = {
  matcher: ["/admin/:path*", "/member/:path*"],
};

