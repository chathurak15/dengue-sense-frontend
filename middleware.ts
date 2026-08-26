import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Route-protection middleware.
 *
 * The `ds_auth` cookie stores `ROLE:STATUS` (e.g. "ADMIN:APPROVED").
 * - Unauthenticated users are redirected to /login.
 * - Authenticated users on /login or /register are redirected to their dashboard.
 * - PHI users with PENDING/REJECTED status are sent to /pending.
 * - Non-admin users cannot access /dashboard/admin/*.
 * - Admin users landing on /dashboard are redirected to /dashboard/admin.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("ds_auth")?.value;

  // ── Redirect logged-in users away from /login and /register ──
  if (pathname === "/login" || pathname === "/register") {
    if (authCookie) {
      const [role, status] = authCookie.split(":");

      if (status !== "APPROVED") {
        return NextResponse.redirect(new URL("/pending", request.url));
      }
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ── Guard /dashboard/* and /phi/* ──
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/phi")) {
    if (!authCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const [role, status] = authCookie.split(":");

    if (role === "PHI" && status !== "APPROVED") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }

    if (
      pathname.startsWith("/dashboard/admin") &&
      role !== "ADMIN" &&
      role !== "MOH"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname === "/dashboard" && role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }
  }

  // ── Guard /pending ──
  if (pathname === "/pending") {
    if (!authCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const [role, status] = authCookie.split(":");
    if (status === "APPROVED") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/dashboard/:path*", "/phi/:path*", "/pending"],
};
