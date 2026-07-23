import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP Basic auth for the admin surface. Active only when ADMIN_PASSWORD is
 * set (production); local dev without the env var stays open.
 * Username: admin. Customer-facing routes are never gated — POST /api/orders
 * (checkout) stays public; the order-list GET and order-status PATCH are protected.
 * /api/report/send has its own CRON_SECRET check and is excluded here so
 * platform crons can reach it.
 */
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Platform crons reach the report endpoint with the CRON_SECRET (Bearer header
  // or ?secret=). Let those through untouched so scheduled reports keep working;
  // the route validates the secret itself.
  if (pathname.startsWith("/api/report/send")) {
    const secret = process.env.CRON_SECRET;
    const header = request.headers.get("authorization") ?? "";
    if (secret && (header === `Bearer ${secret}` || request.nextUrl.searchParams.get("secret") === secret)) {
      return NextResponse.next();
    }
  }

  const needsAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/report/send") ||
    // POST /api/orders (checkout) stays public; GET (order list) and PATCH
    // (order status updates) are admin-only.
    (pathname.startsWith("/api/orders") && request.method !== "POST");

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
  matcher: ["/admin/:path*", "/api/settings/:path*", "/api/orders/:path*", "/api/report/send"],
};
