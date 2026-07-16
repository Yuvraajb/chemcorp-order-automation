import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Truck, FileText } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { ProductImage } from "@/components/product-image";
import { ProductCard } from "@/components/product-card";
import { AddToCart } from "@/components/add-to-cart";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/products" className="transition-colors hover:text-accent">
          Products
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href={`/brands/${product.brand_slug}`} className="transition-colors hover:text-accent">
          {product.brand_name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-semibold text-primary">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ProductImage
          name={product.name}
          color={product.brand_color ?? "#0369A1"}
          seed={product.id}
          className="aspect-[4/3] w-full rounded-2xl border border-border"
        />

        <div>
          <Link
            href={`/brands/${product.brand_slug}`}
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: product.brand_color ?? "#0369A1" }}
          >
            {product.brand_name}
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-muted">
            {product.grade} · {product.category}
          </p>

          <p className="mt-6 font-heading text-4xl font-bold text-primary">
            {formatINR(product.price)}
            <span className="ml-2 text-base font-normal text-muted">
              per {product.unit} ({product.packaging}) · excl. GST
            </span>
          </p>

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-border bg-surface p-6 text-sm">
            {[
              ["CAS Number", product.cas_number],
              ["Grade", product.grade],
              ["Packaging", product.packaging],
              ["Minimum order", `${product.min_order_qty} ${product.unit}s`],
              ["Category", product.category],
              ["Availability", product.in_stock ? "In stock" : "Out of stock"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">{label}</dt>
                <dd className="mt-1 font-semibold text-primary">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 space-y-2.5 text-sm text-muted">
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              Certificate of analysis and MSDS included with every dispatch
            </li>
            <li className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              Hazmat-compliant delivery within 48 hours to major clusters
            </li>
            <li className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              GST invoice raised against your GSTIN at checkout
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-primary">
            More from {product.brand_name}
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
