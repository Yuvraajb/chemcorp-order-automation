import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getBrandBySlug, getProductsByBrand } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  const products = getProductsByBrand(brand.id);

  return (
    <>
      <section className="text-white" style={{ backgroundColor: brand.color }}>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/70">
            <Link href="/brands" className="transition-colors hover:text-white">
              Our Brands
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-semibold text-white">{brand.name}</span>
          </nav>
          <h1 className="mt-4 font-heading text-4xl font-bold">{brand.name}</h1>
          <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-white/80">
            {brand.category}
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-white/90">{brand.description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="font-heading text-2xl font-bold text-primary">
          Product line ({products.length})
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </>
  );
}
