import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

async function currentSettings() {
  return {
    reportEmail: await getSetting("report_email"),
    reportHour: await getSetting("report_hour"),
    companyName: await getSetting("company_name"),
  };
}

export async function GET() {
  return NextResponse.json(await currentSettings());
}

export async function PUT(req: NextRequest) {
  let body: { reportEmail?: string; reportHour?: string; companyName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.reportEmail !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.reportEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    await setSetting("report_email", body.reportEmail.trim());
  }

  if (body.reportHour !== undefined) {
    const hour = Number(body.reportHour);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      return NextResponse.json({ error: "Report hour must be 0–23." }, { status: 400 });
    }
    await setSetting("report_hour", String(hour));
  }

  if (body.companyName !== undefined && body.companyName.trim()) {
    await setSetting("company_name", body.companyName.trim());
  }

  return NextResponse.json(await currentSettings());
}
