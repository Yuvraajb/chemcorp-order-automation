import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getOrders } from "@/lib/queries";

export const dynamic = "force-dynamic";

const GST_RATE = 0.18;

/**
 * Fires the new order at the n8n stock/BOM/purchasing pipeline. Best-effort: n8n being
 * down or unconfigured must never block or fail checkout, so this never throws.
 */
function notifyN8nOrderCreated(
  orderNumber: string,
  resolved: { product: ResolvedProduct; quantity: number }[]
) {
  const webhookUrl = process.env.N8N_ORDER_WEBHOOK_URL;
  if (!webhookUrl) return;

  fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderNumber,
      items: resolved.map(({ product, quantity }) => ({
        product: product.name,
        qtyOrdered: quantity,
      })),
    }),
  }).catch((err) => {
    console.error("[n8n] Failed to notify order webhook:", err);
  });
}

interface IncomingItem {
  productId: number;
  quantity: number;
}

interface ResolvedProduct {
  id: number;
  name: string;
  grade: string;
  packaging: string;
  unit: string;
  pack_size_kg: number;
  price: number;
  min_order_qty: number;
  brand_name: string;
}

export async function POST(req: NextRequest) {
  let body: {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    gstin?: string;
    notes?: string;
    items?: IncomingItem[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyName, contactName, email, phone, gstin, notes, items } = body;

  if (!companyName?.trim() || !contactName?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { error: "Company name, contact person and phone are required." },
      { status: 400 }
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const pool = await getPool();

  const resolved: { product: ResolvedProduct; quantity: number }[] = [];
  for (const item of items) {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.grade, p.packaging, p.unit, p.pack_size_kg, p.price, p.min_order_qty, b.name AS brand_name
       FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.id = $1`,
      [item.productId]
    );
    const product = rows[0] as ResolvedProduct | undefined;
    if (!product) {
      return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 400 });
    }
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: `Invalid quantity for ${product.name}.` }, { status: 400 });
    }
    if (quantity < product.min_order_qty) {
      return NextResponse.json(
        { error: `${product.name} has a minimum order of ${product.min_order_qty} kg.` },
        { status: 400 }
      );
    }
    if (quantity % product.pack_size_kg !== 0) {
      return NextResponse.json(
        {
          error: `${product.name} ships in ${product.pack_size_kg} kg packs (${product.packaging}) — quantity must be a multiple of ${product.pack_size_kg} kg.`,
        },
        { status: 400 }
      );
    }
    resolved.push({ product, quantity });
  }

  const subtotal = resolved.reduce((sum, r) => sum + r.product.price * r.quantity, 0);
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + tax;

  const client = await pool.connect();
  let orderNumber: string;
  try {
    await client.query("BEGIN");

    const seqResult = await client.query("SELECT nextval('order_number_seq')::int AS seq");
    const seq: number = seqResult.rows[0].seq;
    const now = new Date();
    const istDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" })
      .format(now)
      .replace(/-/g, "");
    orderNumber = `CC-${istDate}-${String(seq).padStart(4, "0")}`;

    const orderResult = await client.query(
      `INSERT INTO orders (order_number, company_name, contact_name, email, phone, gstin, notes, subtotal, tax, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        orderNumber,
        companyName.trim(),
        contactName.trim(),
        email.trim(),
        phone.trim(),
        gstin?.trim() || null,
        notes?.trim() || null,
        subtotal,
        tax,
        total,
      ]
    );
    const orderId: number = orderResult.rows[0].id;

    for (const { product, quantity } of resolved) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, brand_name, grade, packaging, unit, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          orderId,
          product.id,
          product.name,
          product.brand_name,
          product.grade,
          product.packaging,
          product.unit,
          product.price,
          quantity,
          product.price * quantity,
        ]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  notifyN8nOrderCreated(orderNumber, resolved);

  return NextResponse.json({ orderNumber, subtotal, tax, total }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ orders: await getOrders() });
}
