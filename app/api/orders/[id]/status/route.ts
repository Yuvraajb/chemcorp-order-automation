import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/queries";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "fulfilled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Status must be 'pending' or 'fulfilled'." }, { status: 400 });
  }

  await updateOrderStatus(orderId, body.status);
  return NextResponse.json({ ok: true });
}
