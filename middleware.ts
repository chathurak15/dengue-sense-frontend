import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Route protection middleware.
 *
 * Runs at the Edge before any page renders — zero client-JS required.
 * Reads the `ds_auth` cookie that is set on successful login.
 * Any request to /dashboard/* without that cookie is redirected to /login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard the dashboard subtree
  if (pathname.startsWith("/dashboard")) {
    const authCookie = request.cookies.get("ds_auth");
    if (!authCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      // Preserve the intended destination so the login page can redirect back
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
