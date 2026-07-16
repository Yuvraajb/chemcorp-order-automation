import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { getOrderByNumber } from "@/lib/queries";
import { formatINR, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = getOrderByNumber(orderNumber);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success" aria-hidden="true" />
        <h1 className="mt-5 font-heading text-4xl font-bold text-primary">Order received</h1>
        <p className="mt-3 text-lg text-muted">
          Thank you, {order.contact_name}. Your order{" "}
          <strong className="text-primary">{order.order_number}</strong> is with our desk — a
          confirmation is on its way to <strong className="text-primary">{order.email}</strong>.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted-bg px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Order number</p>
            <p className="font-heading font-bold text-primary">{order.order_number}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Placed</p>
            <p className="font-semibold text-primary">{formatDate(order.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Company</p>
            <p className="font-semibold text-primary">{order.company_name}</p>
          </div>
        </div>

        <ul className="divide-y divide-border px-6">
          {order.items?.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-4 text-sm">
              <div>
                <p className="font-semibold text-primary">{item.product_name}</p>
                <p className="text-xs text-muted">
                  {item.brand_name} · {item.grade} · {item.packaging}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{formatINR(item.line_total)}</p>
                <p className="text-xs text-muted">
                  {item.quantity} × {formatINR(item.unit_price)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-border bg-muted-bg px-6 py-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold text-primary">{formatINR(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">GST (18%)</dt>
            <dd className="font-semibold text-primary">{formatINR(order.tax)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-base">
            <dt className="font-bold text-primary">Total</dt>
            <dd className="font-heading font-bold text-accent">{formatINR(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/products"
          className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent px-8 text-sm font-bold text-white transition-colors duration-200 hover:bg-accent-dark"
        >
          Continue browsing <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
