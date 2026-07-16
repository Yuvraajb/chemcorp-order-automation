"use client";

import Link from "next/link";
import { Trash2, Minus, Plus, ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const tax = Math.round(subtotal * 0.18);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted-bg text-muted">
          <ShoppingCart className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold text-primary">Your cart is empty</h1>
        <p className="mt-3 text-muted">
          Browse the catalog and add products to build your bulk order.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-8 text-sm font-bold text-white transition-colors duration-200 hover:bg-accent-dark"
        >
          Browse products <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-4xl font-bold text-primary">Your cart</h1>
      <p className="mt-2 text-muted">{items.length} product{items.length === 1 ? "" : "s"} ready for checkout.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-5"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: item.brandColor }}
                aria-hidden="true"
              >
                {item.brandName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-primary">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.brandName} · {item.grade} · {item.packaging}
                </p>
                <p className="mt-1 text-sm font-bold text-primary">
                  {formatINR(item.price)} <span className="font-normal text-muted">/ {item.unit}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, Math.max(item.minOrderQty, item.quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-l-lg text-primary transition-colors hover:bg-muted-bg"
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="min-w-10 text-center text-sm font-bold text-primary">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-r-lg text-primary transition-colors hover:bg-muted-bg"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="min-w-24 text-right text-sm font-bold text-primary">
                  {formatINR(item.price * item.quantity)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-destructive"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="font-heading text-lg font-bold text-primary">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-primary">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">GST (18%)</dt>
              <dd className="font-semibold text-primary">{formatINR(tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-bold text-primary">Total</dt>
              <dd className="font-heading font-bold text-accent">{formatINR(subtotal + tax)}</dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-bold text-white transition-colors duration-200 hover:bg-accent-dark"
          >
            Proceed to checkout <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted">
            Final freight is confirmed by the order desk before dispatch.
          </p>
        </aside>
      </div>
    </div>
  );
}
