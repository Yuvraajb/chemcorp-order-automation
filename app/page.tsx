import Link from "next/link";
import { ArrowRight, Truck, ShieldCheck, FileCheck2, Building2 } from "lucide-react";
import { getBrands, getFeaturedProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

const VALUE_PROPS = [
  {
    icon: ShieldCheck,
    title: "Certified quality",
    body: "Every batch ships with a certificate of analysis and MSDS documentation.",
  },
  {
    icon: Truck,
    title: "Pan-India logistics",
    body: "Hazmat-compliant fleet with dedicated routes to every major industrial cluster.",
  },
  {
    icon: FileCheck2,
    title: "GST-ready invoicing",
    body: "Clean B2B paperwork — GSTIN capture, itemised tax and credit-friendly billing.",
  },
  {
    icon: Building2,
    title: "One group, 15 brands",
    body: "A single order desk covering solvents to specialty enzymes. One relationship, full coverage.",
  },
];

export default function HomePage() {
  const brands = getBrands();
  const featured = getFeaturedProducts(8);
  const totalProducts = brands.reduce((sum, b) => sum + (b.product_count ?? 0), 0);

  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
              B2B chemical distribution
            </p>
            <h1 className="mt-4 font-heading text-4xl font-bold leading-tight sm:text-5xl">
              Every chemical your plant needs.
              <span className="text-sky-300"> One order desk.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              ChemCorp Industries unites 15 specialty brands and {totalProducts}+ products —
              solvents, water treatment, polymers, pharma intermediates and more — behind a
              single bulk-ordering platform built for business buyers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-sky-600"
              >
                Browse the catalog
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/brands"
                className="inline-flex h-12 items-center rounded-lg border border-white/25 px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/10"
              >
                Meet our 15 brands
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {[
              { label: "Subsidiary brands", value: "15" },
              { label: "Products in catalog", value: `${totalProducts}+` },
              { label: "Industrial categories", value: "15" },
              { label: "Order turnaround", value: "48 hrs" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {stat.label}
                </dt>
                <dd className="mt-2 font-heading text-3xl font-bold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((prop) => (
            <div key={prop.title} className="rounded-xl border border-border bg-surface p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-light text-accent">
                <prop.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-heading text-base font-semibold text-primary">
                {prop.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{prop.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brands */}
      <section className="bg-muted-bg">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl font-bold text-primary">Our brands</h2>
              <p className="mt-2 max-w-xl text-muted">
                Fifteen focused subsidiaries, each a specialist in its category.
              </p>
            </div>
            <Link
              href="/brands"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-accent transition-colors hover:text-accent-dark"
            >
              View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {brands.slice(0, 10).map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group rounded-xl border border-border bg-surface p-5 transition-shadow duration-200 hover:shadow-md"
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: brand.color }}
                  aria-hidden="true"
                >
                  {brand.name.slice(0, 2).toUpperCase()}
                </span>
                <p className="mt-3 font-heading text-sm font-semibold text-primary group-hover:text-accent">
                  {brand.name}
                </p>
                <p className="mt-1 text-xs text-muted">{brand.category}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-3xl font-bold text-primary">Frequently ordered</h2>
            <p className="mt-2 text-muted">A sample of what buyers reorder month after month.</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent transition-colors hover:text-accent-dark"
          >
            Full catalog <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl bg-primary px-6 py-14 text-center text-white sm:px-12">
          <h2 className="font-heading text-3xl font-bold">Ready to place a bulk order?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Add products to your cart, submit your company details, and our order desk confirms
            pricing and dispatch within one business day.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-8 text-sm font-bold transition-colors duration-200 hover:bg-sky-600"
          >
            Start ordering <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
