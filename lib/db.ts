import { Pool, PoolClient } from "pg";
import { BRAND_SEEDS, GRADE_VARIANTS } from "./seed-data";

const IST = "Asia/Kolkata";

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

/** Today's date (YYYY-MM-DD) in IST, regardless of server timezone. */
export function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());
}

/** Current hour (0-23) in IST. */
export function istHour(): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "numeric", hour12: false }).format(
      new Date()
    )
  );
}

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

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    color TEXT NOT NULL,
    category TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    report_date TEXT NOT NULL,
    recipient TEXT NOT NULL,
    order_count INTEGER NOT NULL,
    total_value INTEGER NOT NULL,
    delivery TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

async function seed(client: PoolClient) {
  for (const brand of BRAND_SEEDS) {
    const brandResult = await client.query(
      `INSERT INTO brands (name, slug, tagline, description, color, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [brand.name, brand.slug, brand.tagline, brand.description, brand.color, brand.category]
    );
    const brandId: number = brandResult.rows[0].id;

    for (const chemical of brand.chemicals) {
      for (const variant of GRADE_VARIANTS) {
        const key = `${brand.slug}-${chemical}-${variant.grade}`;
        const h = hash(key);
        const basePrice = 800 + (h % 42) * 250; // ₹800 – ₹11,050 per pack
        const price = Math.round(basePrice * variant.priceFactor);
        const cas = `${1000 + (h % 9000)}-${10 + (h % 90)}-${h % 10}`;
        const inStock = h % 11 === 0 ? 0 : 1; // ~9% marked out of stock

        await client.query(
          `INSERT INTO products (brand_id, name, slug, cas_number, category, grade, packaging, unit, price, min_order_qty, in_stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
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
            inStock,
          ]
        );
      }
    }
  }

  await client.query(
    `INSERT INTO settings (key, value) VALUES
       ('report_email', 'yuvraajbhatter10@gmail.com'),
       ('report_hour', '18'),
       ('company_name', 'ChemCorp Industries')
     ON CONFLICT (key) DO NOTHING`
  );
}

async function init(p: Pool) {
  const client = await p.connect();
  try {
    // Advisory lock: serverless can boot many instances at once — only one seeds.
    await client.query("SELECT pg_advisory_lock(727272)");
    await client.query(SCHEMA);
    const { rows } = await client.query("SELECT COUNT(*)::int AS c FROM brands");
    if (rows[0].c === 0) {
      await seed(client);
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(727272)").catch(() => {});
    client.release();
  }
}

export async function getPool(): Promise<Pool> {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — point it at your Postgres instance.");
    }
    pool = new Pool({
      connectionString,
      max: 5,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }
  if (!initPromise) {
    initPromise = init(pool).catch((err) => {
      initPromise = null; // allow retry on next request
      throw err;
    });
  }
  await initPromise;
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const p = await getPool();
  const result = await p.query(text, params);
  return result.rows as T[];
}

export async function getSetting(key: string): Promise<string | null> {
  const rows = await query<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [key, value]
  );
}
