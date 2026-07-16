import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getOrders } from "@/lib/queries";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const GST_RATE = 0.18;

interface IncomingItem {
  productId: number;
  quantity: number;
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

  const db = getDb();
  const productStmt = db.prepare(
    `SELECT p.*, b.name AS brand_name FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.id = ?`
  );

  const resolved: { product: Product & { brand_name: string }; quantity: number }[] = [];
  for (const item of items) {
    const product = productStmt.get(item.productId) as (Product & { brand_name: string }) | undefined;
    if (!product) {
      return NextResponse.json({ error: `Product ${item.productId} not found.` }, { status: 400 });
    }
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ error: `Invalid quantity for ${product.name}.` }, { status: 400 });
    }
    if (quantity < product.min_order_qty) {
      return NextResponse.json(
        { error: `${product.name} has a minimum order of ${product.min_order_qty} ${product.unit}s.` },
        { status: 400 }
      );
    }
    resolved.push({ product, quantity });
  }

  const subtotal = resolved.reduce((sum, r) => sum + r.product.price * r.quantity, 0);
  const tax = Math.round(subtotal * GST_RATE);
  const total = subtotal + tax;

  const seq = (db.prepare("SELECT COUNT(*) AS c FROM orders").get() as { c: number }).c + 1;
  const now = new Date();
  const orderNumber = `CC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}-${String(seq).padStart(4, "0")}`;

  const insertOrder = db.prepare(
    `INSERT INTO orders (order_number, company_name, contact_name, email, phone, gstin, notes, subtotal, tax, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, brand_name, grade, packaging, unit, unit_price, quantity, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const create = db.transaction(() => {
    const result = insertOrder.run(
      orderNumber,
      companyName.trim(),
      contactName.trim(),
      email.trim(),
      phone.trim(),
      gstin?.trim() || null,
      notes?.trim() || null,
      subtotal,
      tax,
      total
    );
    const orderId = Number(result.lastInsertRowid);
    for (const { product, quantity } of resolved) {
      insertItem.run(
        orderId,
        product.id,
        product.name,
        product.brand_name,
        product.grade,
        product.packaging,
        product.unit,
        product.price,
        quantity,
        product.price * quantity
      );
    }
  });

  create();

  return NextResponse.json({ orderNumber, subtotal, tax, total }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ orders: getOrders() });
}
