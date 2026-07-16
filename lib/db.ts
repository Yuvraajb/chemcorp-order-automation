import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { BRAND_SEEDS, GRADE_VARIANTS } from "./seed-data";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, "chemcorp.db");

let db: Database.Database | null = null;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[%()/]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Deterministic hash so seeded prices/CAS numbers are stable across machines.
function hash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

function seed(database: Database.Database) {
  const insertBrand = database.prepare(
    `INSERT INTO brands (name, slug, tagline, description, color, category) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertProduct = database.prepare(
    `INSERT INTO products (brand_id, name, slug, cas_number, category, grade, packaging, unit, price, min_order_qty, in_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const seedAll = database.transaction(() => {
    for (const brand of BRAND_SEEDS) {
      const result = insertBrand.run(
        brand.name,
        brand.slug,
        brand.tagline,
        brand.description,
        brand.color,
        brand.category
      );
      const brandId = Number(result.lastInsertRowid);

      for (const chemical of brand.chemicals) {
        for (const variant of GRADE_VARIANTS) {
          const key = `${brand.slug}-${chemical}-${variant.grade}`;
          const h = hash(key);
          const basePrice = 800 + (h % 42) * 250; // ₹800 – ₹11,050 per pack
          const price = Math.round(basePrice * variant.priceFactor);
          const cas = `${1000 + (h % 9000)}-${10 + (h % 90)}-${h % 10}`;
          const inStock = h % 11 === 0 ? 0 : 1; // ~9% marked out of stock

          insertProduct.run(
            brandId,
            chemical,
            slugify(`${chemical}-${variant.grade}-${brand.slug}`),
            cas,
            brand.category,
            variant.grade,
            variant.packaging,
            variant.unit,
            price,
            variant.minOrderQty,
            inStock
          );
        }
      }
    }

    const insertSetting = database.prepare(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
    );
    insertSetting.run("report_email", "yuvraajbhatter10@gmail.com");
    insertSetting.run("report_hour", "18");
    insertSetting.run("company_name", "ChemCorp Industries");
  });

  seedAll();
}

export function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      color TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL REFERENCES brands(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      cas_number TEXT NOT NULL,
      category TEXT NOT NULL,
      grade TEXT NOT NULL,
      packaging TEXT NOT NULL,
      unit TEXT NOT NULL,
      price INTEGER NOT NULL,
      min_order_qty INTEGER NOT NULL DEFAULT 1,
      in_stock INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      gstin TEXT,
      notes TEXT,
      subtotal INTEGER NOT NULL,
      tax INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'received',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      brand_name TEXT NOT NULL,
      grade TEXT NOT NULL,
      packaging TEXT NOT NULL,
      unit TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      line_total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS report_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_date TEXT NOT NULL,
      recipient TEXT NOT NULL,
      order_count INTEGER NOT NULL,
      total_value INTEGER NOT NULL,
      delivery TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  const brandCount = db.prepare("SELECT COUNT(*) as c FROM brands").get() as { c: number };
  if (brandCount.c === 0) {
    seed(db);
  }

  return db;
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}
