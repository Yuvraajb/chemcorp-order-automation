import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBrands } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Our Brands" };

export default function BrandsPage() {
  const brands = getBrands();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">The group</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-primary">
        15 brands, one order desk
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Each subsidiary is a specialist in its category. Browse a brand to see its full product
        line, or search the combined catalog.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition-shadow duration-200 hover:shadow-lg hover:shadow-slate-200"
          >
            <div className="flex items-center gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white"
                style={{ backgroundColor: brand.color }}
                aria-hidden="true"
              >
                {brand.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold text-primary group-hover:text-accent">
                  {brand.name}
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {brand.category}
                </p>
              </div>
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{brand.tagline}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent">
              {brand.product_count} products
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
