import Link from "next/link";
import { Search } from "lucide-react";
import { getProducts, getBrands, getCategories } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export const metadata = { title: "Product Catalog" };

const PER_PAGE = 24;

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; brand?: string; category?: string; page?: string }>;
}) {
  const { q, brand, category, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { products, total } = getProducts({
    search: q,
    brand,
    category,
    page,
    perPage: PER_PAGE,
  });
  const brands = getBrands();
  const categories = getCategories();
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-4xl font-bold text-primary">Product catalog</h1>
      <p className="mt-2 text-lg text-muted">
        {total} products across {brands.length} brands. Prices are per pack, exclusive of GST.
      </p>

      {/* Filters */}
      <form method="GET" className="mt-8 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[1fr_220px_220px_auto]">
        <div>
          <label htmlFor="q" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
            Search
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="Product name, CAS number, brand…"
              className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <div>
          <label htmlFor="brand" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
            Brand
          </label>
          <select
            id="brand"
            name="brand"
            defaultValue={brand ?? ""}
            className="h-11 w-full cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={category ?? ""}
            className="h-11 w-full cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-11 rounded-lg bg-accent px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-accent-dark"
          >
            Filter
          </button>
          {(q || brand || category) && (
            <Link
              href="/products"
              className="flex h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-muted transition-colors hover:bg-muted-bg"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Results */}
      {products.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-border bg-surface p-14 text-center">
          <p className="font-heading text-lg font-semibold text-primary">No products found</p>
          <p className="mt-2 text-sm text-muted">
            Try a different search term, or{" "}
            <Link href="/products" className="font-bold text-accent hover:underline">
              clear all filters
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/products${buildQuery({ q, brand, category, page: String(page - 1) })}`}
              className="flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-primary transition-colors hover:bg-muted-bg"
            >
              Previous
            </Link>
          )}
          <span className="px-3 text-sm font-semibold text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/products${buildQuery({ q, brand, category, page: String(page + 1) })}`}
              className="flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-primary transition-colors hover:bg-muted-bg"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
