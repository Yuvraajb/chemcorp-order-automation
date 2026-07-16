"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, ArrowLeft } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { formatINR } from "@/lib/format";

interface Field {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  autoComplete?: string;
  helper?: string;
}

const FIELDS: Field[] = [
  { name: "companyName", label: "Company name", type: "text", required: true, placeholder: "Acme Manufacturing Pvt Ltd", autoComplete: "organization" },
  { name: "contactName", label: "Contact person", type: "text", required: true, placeholder: "Full name", autoComplete: "name" },
  { name: "email", label: "Business email", type: "email", required: true, placeholder: "purchase@company.com", autoComplete: "email", helper: "Order confirmation will be sent here." },
  { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "+91 98765 43210", autoComplete: "tel" },
  { name: "gstin", label: "GSTIN", type: "text", required: false, placeholder: "22AAAAA0000A1Z5", helper: "Optional — needed for GST invoice credit." },
];

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tax = Math.round(subtotal * 0.18);

  if (items.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-heading text-3xl font-bold text-primary">Nothing to check out</h1>
        <p className="mt-3 text-muted">Your cart is empty. Add products first.</p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-12 items-center rounded-lg bg-accent px-8 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
        >
          Browse products
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      companyName: form.get("companyName"),
      contactName: form.get("contactName"),
      email: form.get("email"),
      phone: form.get("phone"),
      gstin: form.get("gstin"),
      notes: form.get("notes"),
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong placing the order.");
      }
      clear();
      router.push(`/order/${data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please retry.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link
        href="/cart"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to cart
      </Link>
      <h1 className="mt-3 font-heading text-4xl font-bold text-primary">Checkout</h1>
      <p className="mt-2 text-muted">
        Submit your company details — the order desk confirms pricing and dispatch within one
        business day.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 sm:p-8" noValidate={false}>
          <h2 className="font-heading text-lg font-bold text-primary">Company details</h2>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.name} className={field.name === "companyName" ? "sm:col-span-2" : ""}>
                <label htmlFor={field.name} className="mb-1.5 block text-sm font-bold text-primary">
                  {field.label}
                  {field.required && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {field.helper && <p className="mt-1.5 text-xs text-muted">{field.helper}</p>}
              </div>
            ))}
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="mb-1.5 block text-sm font-bold text-primary">
                Order notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Delivery instructions, preferred dispatch dates, packaging requirements…"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-bold text-white transition-colors duration-200 hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Placing order…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden="true" /> Place order · {formatINR(subtotal + tax)}
              </>
            )}
          </button>
          <p className="mt-3 text-xs text-muted">
            No payment is collected online. Payment terms are agreed with the order desk on
            confirmation.
          </p>
        </form>

        <aside className="h-fit rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="font-heading text-lg font-bold text-primary">
            Order summary ({items.length})
          </h2>
          <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3 text-sm">
                <span className="text-primary">
                  {item.name}
                  <span className="block text-xs text-muted">
                    {item.quantity} × {formatINR(item.price)} · {item.brandName}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-primary">
                  {formatINR(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-primary">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">GST (18%)</dt>
              <dd className="font-semibold text-primary">{formatINR(tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2.5 text-base">
              <dt className="font-bold text-primary">Total</dt>
              <dd className="font-heading font-bold text-accent">{formatINR(subtotal + tax)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
