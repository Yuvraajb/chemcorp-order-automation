"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { useCart } from "./cart-context";
import type { Product } from "@/lib/types";

export function AddToCart({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(product.min_order_qty);
  const [added, setAdded] = useState(false);

  if (!product.in_stock) {
    return (
      <span className="inline-flex items-center rounded-lg bg-muted-bg px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted">
        Out of stock
      </span>
    );
  }

  const packSizeKg = product.pack_size_kg;
  const packCount = quantity / packSizeKg;

  const add = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        brandName: product.brand_name ?? "",
        brandColor: product.brand_color ?? "#0369A1",
        grade: product.grade,
        packaging: product.packaging,
        unit: product.unit,
        packSizeKg,
        price: product.price,
        minOrderQty: product.min_order_qty,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={add}
        className={`flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition-colors duration-200 ${
          added ? "bg-success" : "bg-accent hover:bg-accent-dark"
        }`}
        aria-label={`Add ${product.name} to cart`}
      >
        {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
        {added ? "Added" : "Add"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-border bg-surface">
        <button
          type="button"
          onClick={() => setQuantity(Math.max(product.min_order_qty, quantity - packSizeKg))}
          className="flex h-11 w-11 items-center justify-center rounded-l-lg text-primary transition-colors hover:bg-muted-bg"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="min-w-16 text-center text-sm font-bold text-primary" aria-live="polite">
          {quantity} kg
        </span>
        <button
          type="button"
          onClick={() => setQuantity(quantity + packSizeKg)}
          className="flex h-11 w-11 items-center justify-center rounded-r-lg text-primary transition-colors hover:bg-muted-bg"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        onClick={add}
        className={`flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-bold text-white transition-colors duration-200 ${
          added ? "bg-success" : "bg-accent hover:bg-accent-dark"
        }`}
      >
        {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
        {added ? "Added to cart" : "Add to cart"}
      </button>
      <p className="w-full text-xs text-muted">
        = {packCount} {product.unit}
        {packCount > 1 ? "s" : ""} of {product.packaging} · Minimum order: {product.min_order_qty} kg
      </p>
    </div>
  );
}
