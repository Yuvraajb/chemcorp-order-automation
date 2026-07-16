import Link from "next/link";
import { ProductImage } from "./product-image";
import { AddToCart } from "./add-to-cart";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow duration-200 hover:shadow-lg hover:shadow-slate-200">
      <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}, ${product.grade}`}>
        <ProductImage
          name={product.name}
          color={product.brand_color ?? "#0369A1"}
          seed={product.id}
          className="aspect-[4/3] w-full"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: product.brand_color ?? "#0369A1" }}
        >
          {product.brand_name}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="font-heading text-[15px] font-semibold leading-snug text-primary transition-colors group-hover:text-accent"
        >
          {product.name}
        </Link>
        <p className="text-xs text-muted">
          {product.grade} · {product.packaging} · CAS {product.cas_number}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-lg font-bold text-primary">{formatINR(product.price)}</p>
            <p className="text-[11px] text-muted">per {product.unit} · MOQ {product.min_order_qty}</p>
          </div>
          <AddToCart product={product} compact />
        </div>
      </div>
    </article>
  );
}
