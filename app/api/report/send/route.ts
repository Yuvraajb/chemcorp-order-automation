import { NextRequest, NextResponse } from "next/server";
import { runDailyReport } from "@/lib/report";

export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization");

  // Admin "Send now" button: browser re-sends the /admin Basic-auth credentials
  // on this same-origin fetch. Accept those so the button works without exposing
  // any server secret to the client.
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && header?.startsWith("Basic ")) {
    try {
      const [user, pass] = atob(header.slice(6)).split(":");
      if (user === "admin" && pass === adminPassword) return true;
    } catch {
      // malformed header — fall through to the secret check
    }
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured — open (local/dev use)
  return header === `Bearer ${secret}` || req.nextUrl.searchParams.get("secret") === secret;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const date = req.nextUrl.searchParams.get("date") || undefined;
  try {
    const result = await runDailyReport(date);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Report generation failed" },
      { status: 500 }
    );
  }
}

// POST for the admin "Send now" button; GET for cron services (Vercel Cron, cron-job.org).
export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
