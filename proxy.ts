import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP Basic auth for the admin surface. Active only when ADMIN_PASSWORD is
 * set (production); local dev without the env var stays open.
 * Username: admin. Customer-facing routes are never gated — POST /api/orders
 * (checkout) stays public, only the order-list GET is protected.
 * /api/report/send has its own CRON_SECRET check and is excluded here so
 * platform crons can reach it.
 */
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/settings") ||
    (pathname.startsWith("/api/orders") && request.method === "GET");

  if (!needsAuth) return NextResponse.next();

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const [user, pass] = atob(header.slice(6)).split(":");
      if (user === "admin" && pass === password) return NextResponse.next();
    } catch {
      // malformed header — fall through to 401
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ChemCorp Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/settings/:path*", "/api/orders/:path*"],
};
