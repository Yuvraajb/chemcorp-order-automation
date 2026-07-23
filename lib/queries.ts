import { query } from "./db";
import type { Brand, Product, Order, OrderItem } from "./types";

// created_at is returned as an IST wall-clock string ("YYYY-MM-DDTHH:MM:SS")
// so display code never depends on the server's timezone.
const CREATED_AT_IST = `to_char(o.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD"T"HH24:MI:SS')`;

const PRODUCT_SELECT = `
  SELECT p.*, b.name AS brand_name, b.slug AS brand_slug, b.color AS brand_color
  FROM products p JOIN brands b ON b.id = p.brand_id
`;

const ORDER_SELECT = `
  SELECT o.id, o.order_number, o.company_name, o.contact_name, o.email, o.phone,
         o.gstin, o.notes, o.subtotal, o.tax, o.total, o.status,
         ${CREATED_AT_IST} AS created_at
  FROM orders o
`;

export async function getBrands(): Promise<Brand[]> {
  return query<Brand>(
    `SELECT b.*, COUNT(p.id)::int AS product_count
     FROM brands b LEFT JOIN products p ON p.brand_id = b.id
     GROUP BY b.id ORDER BY b.name`
  );
}

export async function getBrandBySlug(slug: string): Promise<Brand | undefined> {
  const rows = await query<Brand>("SELECT * FROM brands WHERE slug = $1", [slug]);
  return rows[0];
}

export async function getProducts(filters: {
  search?: string;
  brand?: string;
  category?: string;
  page?: number;
  perPage?: number;
}): Promise<{ products: Product[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    const n = params.length;
    conditions.push(`(p.name ILIKE $${n} OR p.cas_number ILIKE $${n} OR b.name ILIKE $${n})`);
  }
  if (filters.brand) {
    params.push(filters.brand);
    conditions.push(`b.slug = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`p.category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = await query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM products p JOIN brands b ON b.id = p.brand_id ${where}`,
    params
  );

  const perPage = filters.perPage ?? 24;
  const page = Math.max(1, filters.page ?? 1);

  const products = await query<Product>(
    `${PRODUCT_SELECT} ${where} ORDER BY p.name, p.grade LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, perPage, (page - 1) * perPage]
  );

  return { products, total: countRows[0].c };
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const rows = await query<Product>(`${PRODUCT_SELECT} WHERE p.slug = $1`, [slug]);
  return rows[0];
}

export async function getProductsByBrand(brandId: number): Promise<Product[]> {
  return query<Product>(`${PRODUCT_SELECT} WHERE p.brand_id = $1 ORDER BY p.name, p.grade`, [
    brandId,
  ]);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return query<Product>(
    `${PRODUCT_SELECT} WHERE p.brand_id = $1 AND p.id != $2 ORDER BY RANDOM() LIMIT $3`,
    [product.brand_id, product.id, limit]
  );
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return query<Product>(`${PRODUCT_SELECT} WHERE p.in_stock = 1 AND p.id % 29 = 3 LIMIT $1`, [
    limit,
  ]);
}

export async function getCategories(): Promise<string[]> {
  const rows = await query<{ category: string }>(
    "SELECT DISTINCT category FROM products ORDER BY category"
  );
  return rows.map((r) => r.category);
}

async function attachItems(orders: Order[]): Promise<Order[]> {
  if (orders.length === 0) return orders;
  const ids = orders.map((o) => o.id);
  const items = await query<OrderItem>(
    "SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id",
    [ids]
  );
  const byOrder = new Map<number, OrderItem[]>();
  for (const item of items) {
    const list = byOrder.get(item.order_id) ?? [];
    list.push(item);
    byOrder.set(item.order_id, list);
  }
  for (const order of orders) {
    order.items = byOrder.get(order.id) ?? [];
  }
  return orders;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const orders = await query<Order>(`${ORDER_SELECT} WHERE o.order_number = $1`, [orderNumber]);
  await attachItems(orders);
  return orders[0];
}

/** A customer's other still-pending orders, most recent first — shown on the order confirmation page. */
export async function getPendingOrdersForEmail(
  email: string,
  excludeOrderId: number,
  limit = 10
): Promise<Order[]> {
  const orders = await query<Order>(
    `${ORDER_SELECT} WHERE o.email = $1 AND o.status = 'pending' AND o.id != $2
     ORDER BY o.created_at DESC LIMIT $3`,
    [email, excludeOrderId, limit]
  );
  return attachItems(orders);
}

export async function updateOrderStatus(id: number, status: string): Promise<void> {
  await query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
}

export async function getOrders(limit = 100): Promise<Order[]> {
  const orders = await query<Order>(
    `${ORDER_SELECT} ORDER BY o.created_at DESC, o.id DESC LIMIT $1`,
    [limit]
  );
  return attachItems(orders);
}

/** Orders whose IST calendar date matches the given YYYY-MM-DD date. */
export async function getOrdersForDate(date: string): Promise<Order[]> {
  const orders = await query<Order>(
    `${ORDER_SELECT} WHERE (o.created_at AT TIME ZONE 'Asia/Kolkata')::date = $1::date ORDER BY o.created_at`,
    [date]
  );
  return attachItems(orders);
}

export async function countOrdersForDate(date: string): Promise<number> {
  const rows = await query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM orders o WHERE (o.created_at AT TIME ZONE 'Asia/Kolkata')::date = $1::date`,
    [date]
  );
  return rows[0].c;
}

export interface OrderStats {
  todayCount: number;
  todayTotal: number;
  allCount: number;
  allTotal: number;
  pendingCount: number;
  pendingTotal: number;
}

export async function getOrderStats(today: string): Promise<OrderStats> {
  const todayRows = await query<{ c: number; t: number }>(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(total), 0)::int AS t
     FROM orders o WHERE (o.created_at AT TIME ZONE 'Asia/Kolkata')::date = $1::date`,
    [today]
  );
  const allRows = await query<{ c: number; t: number }>(
    "SELECT COUNT(*)::int AS c, COALESCE(SUM(total), 0)::int AS t FROM orders"
  );
  const pendingRows = await query<{ c: number; t: number }>(
    "SELECT COUNT(*)::int AS c, COALESCE(SUM(total), 0)::int AS t FROM orders WHERE status = 'pending'"
  );
  return {
    todayCount: todayRows[0].c,
    todayTotal: todayRows[0].t,
    allCount: allRows[0].c,
    allTotal: allRows[0].t,
    pendingCount: pendingRows[0].c,
    pendingTotal: pendingRows[0].t,
  };
}

export interface PendingDemandRow {
  product_id: number;
  product_name: string;
  brand_name: string;
  packaging: string;
  pending_qty_kg: number;
  pending_orders: number;
  in_stock: number;
}

/** Product-wise open demand (kg still on pending orders) — used to gauge stock position. */
export async function getPendingDemandByProduct(limit = 50): Promise<PendingDemandRow[]> {
  return query<PendingDemandRow>(
    `SELECT oi.product_id, oi.product_name, oi.brand_name, oi.packaging,
            SUM(oi.quantity)::int AS pending_qty_kg,
            COUNT(DISTINCT oi.order_id)::int AS pending_orders,
            COALESCE(p.in_stock, 1) AS in_stock
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE o.status = 'pending'
     GROUP BY oi.product_id, oi.product_name, oi.brand_name, oi.packaging, p.in_stock
     ORDER BY pending_qty_kg DESC
     LIMIT $1`,
    [limit]
  );
}

export interface ReportLogRow {
  id: number;
  report_date: string;
  recipient: string;
  order_count: number;
  total_value: number;
  delivery: string;
}

export async function getRecentReportLogs(limit = 5): Promise<ReportLogRow[]> {
  return query<ReportLogRow>(
    "SELECT id, report_date, recipient, order_count, total_value, delivery FROM report_log ORDER BY id DESC LIMIT $1",
    [limit]
  );
}

export async function hasReportForDate(date: string): Promise<boolean> {
  const rows = await query<{ one: number }>(
    "SELECT 1 AS one FROM report_log WHERE report_date = $1 LIMIT 1",
    [date]
  );
  return rows.length > 0;
}

export async function logReport(entry: {
  date: string;
  recipient: string;
  orderCount: number;
  totalValue: number;
  delivery: string;
}): Promise<void> {
  await query(
    "INSERT INTO report_log (report_date, recipient, order_count, total_value, delivery) VALUES ($1, $2, $3, $4, $5)",
    [entry.date, entry.recipient, entry.orderCount, entry.totalValue, entry.delivery]
  );
}
