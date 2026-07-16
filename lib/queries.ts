import { getDb } from "./db";
import type { Brand, Product, Order, OrderItem } from "./types";

const PRODUCT_SELECT = `
  SELECT p.*, b.name AS brand_name, b.slug AS brand_slug, b.color AS brand_color
  FROM products p JOIN brands b ON b.id = p.brand_id
`;

export function getBrands(): Brand[] {
  return getDb()
    .prepare(
      `SELECT b.*, COUNT(p.id) AS product_count
       FROM brands b LEFT JOIN products p ON p.brand_id = b.id
       GROUP BY b.id ORDER BY b.name`
    )
    .all() as Brand[];
}

export function getBrandBySlug(slug: string): Brand | undefined {
  return getDb().prepare("SELECT * FROM brands WHERE slug = ?").get(slug) as Brand | undefined;
}

export function getProducts(filters: {
  search?: string;
  brand?: string;
  category?: string;
  page?: number;
  perPage?: number;
}): { products: Product[]; total: number } {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.search) {
    conditions.push("(p.name LIKE ? OR p.cas_number LIKE ? OR b.name LIKE ?)");
    const q = `%${filters.search}%`;
    params.push(q, q, q);
  }
  if (filters.brand) {
    conditions.push("b.slug = ?");
    params.push(filters.brand);
  }
  if (filters.category) {
    conditions.push("p.category = ?");
    params.push(filters.category);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const db = getDb();

  const countRow = db
    .prepare(`SELECT COUNT(*) AS c FROM products p JOIN brands b ON b.id = p.brand_id ${where}`)
    .get(...params) as { c: number };

  const perPage = filters.perPage ?? 24;
  const page = Math.max(1, filters.page ?? 1);

  const products = db
    .prepare(`${PRODUCT_SELECT} ${where} ORDER BY p.name, p.grade LIMIT ? OFFSET ?`)
    .all(...params, perPage, (page - 1) * perPage) as Product[];

  return { products, total: countRow.c };
}

export function getProductBySlug(slug: string): Product | undefined {
  return getDb().prepare(`${PRODUCT_SELECT} WHERE p.slug = ?`).get(slug) as Product | undefined;
}

export function getProductsByBrand(brandId: number): Product[] {
  return getDb()
    .prepare(`${PRODUCT_SELECT} WHERE p.brand_id = ? ORDER BY p.name, p.grade`)
    .all(brandId) as Product[];
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return getDb()
    .prepare(`${PRODUCT_SELECT} WHERE p.brand_id = ? AND p.id != ? ORDER BY RANDOM() LIMIT ?`)
    .all(product.brand_id, product.id, limit) as Product[];
}

export function getFeaturedProducts(limit = 8): Product[] {
  return getDb()
    .prepare(`${PRODUCT_SELECT} WHERE p.in_stock = 1 AND p.id % 29 = 3 LIMIT ?`)
    .all(limit) as Product[];
}

export function getCategories(): string[] {
  const rows = getDb()
    .prepare("SELECT DISTINCT category FROM products ORDER BY category")
    .all() as { category: string }[];
  return rows.map((r) => r.category);
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  const order = getDb()
    .prepare("SELECT * FROM orders WHERE order_number = ?")
    .get(orderNumber) as Order | undefined;
  if (order) {
    order.items = getDb()
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .all(order.id) as OrderItem[];
  }
  return order;
}

export function getOrders(limit = 100): Order[] {
  const orders = getDb()
    .prepare("SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT ?")
    .all(limit) as Order[];
  const itemsStmt = getDb().prepare("SELECT * FROM order_items WHERE order_id = ?");
  for (const order of orders) {
    order.items = itemsStmt.all(order.id) as OrderItem[];
  }
  return orders;
}

export function getOrdersForDate(date: string): Order[] {
  const orders = getDb()
    .prepare("SELECT * FROM orders WHERE date(created_at) = date(?) ORDER BY created_at")
    .all(date) as Order[];
  const itemsStmt = getDb().prepare("SELECT * FROM order_items WHERE order_id = ?");
  for (const order of orders) {
    order.items = itemsStmt.all(order.id) as OrderItem[];
  }
  return orders;
}

export interface OrderStats {
  todayCount: number;
  todayTotal: number;
  allCount: number;
  allTotal: number;
}

export function getOrderStats(): OrderStats {
  const db = getDb();
  const today = db
    .prepare(
      "SELECT COUNT(*) AS c, COALESCE(SUM(total), 0) AS t FROM orders WHERE date(created_at) = date('now', 'localtime')"
    )
    .get() as { c: number; t: number };
  const all = db
    .prepare("SELECT COUNT(*) AS c, COALESCE(SUM(total), 0) AS t FROM orders")
    .get() as { c: number; t: number };
  return { todayCount: today.c, todayTotal: today.t, allCount: all.c, allTotal: all.t };
}
