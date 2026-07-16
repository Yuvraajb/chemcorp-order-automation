import { Inbox, IndianRupee, Package, Mail } from "lucide-react";
import { getOrders, getOrderStats } from "@/lib/queries";
import { getSetting, getDb } from "@/lib/db";
import { formatINR, formatDate } from "@/lib/format";
import { ReportSettingsForm, SendReportButton } from "@/components/admin-controls";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin Dashboard" };

interface ReportLogRow {
  id: number;
  report_date: string;
  recipient: string;
  order_count: number;
  total_value: number;
  delivery: string;
  sent_at: string;
}

export default function AdminPage() {
  const stats = getOrderStats();
  const orders = getOrders(50);
  const reportEmail = getSetting("report_email") ?? "";
  const reportHour = getSetting("report_hour") ?? "18";
  const reportLog = getDb()
    .prepare("SELECT * FROM report_log ORDER BY id DESC LIMIT 5")
    .all() as ReportLogRow[];

  const statCards = [
    { icon: Inbox, label: "Orders today", value: String(stats.todayCount) },
    { icon: IndianRupee, label: "Revenue today", value: formatINR(stats.todayTotal) },
    { icon: Package, label: "Orders all-time", value: String(stats.allCount) },
    { icon: Mail, label: "Report goes to", value: reportEmail, small: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-4xl font-bold text-primary">Admin dashboard</h1>
      <p className="mt-2 text-muted">
        Live order desk — incoming orders, daily report automation and settings.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-surface p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent">
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">{card.label}</p>
            <p className={`mt-1 font-heading font-bold text-primary ${card.small ? "break-all text-sm" : "text-2xl"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Orders table */}
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-heading text-lg font-bold text-primary">Recent orders</h2>
          </div>
          {orders.length === 0 ? (
            <p className="px-6 py-14 text-center text-sm text-muted">
              No orders yet. Orders placed on the site appear here instantly.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted-bg text-xs uppercase tracking-wider text-muted">
                    <th scope="col" className="px-6 py-3 font-bold">Order</th>
                    <th scope="col" className="px-4 py-3 font-bold">Company</th>
                    <th scope="col" className="px-4 py-3 font-bold">Items</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">Total</th>
                    <th scope="col" className="px-6 py-3 text-right font-bold">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-muted-bg/60">
                      <td className="px-6 py-3.5 font-semibold text-accent">{order.order_number}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-primary">{order.company_name}</span>
                        <span className="block text-xs text-muted">{order.email}</span>
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        {order.items?.reduce((sum, i) => sum + i.quantity, 0)} units ·{" "}
                        {order.items?.length} lines
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-primary">
                        {formatINR(order.total)}
                      </td>
                      <td className="px-6 py-3.5 text-right text-xs text-muted">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Report automation */}
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-heading text-lg font-bold text-primary">Daily report automation</h2>
            <p className="mt-1.5 text-sm text-muted">
              Every evening, a formatted summary of the day&apos;s orders is emailed automatically.
            </p>
            <div className="mt-5">
              <SendReportButton />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-heading text-lg font-bold text-primary">Report settings</h2>
            <div className="mt-5">
              <ReportSettingsForm initialEmail={reportEmail} initialHour={reportHour} />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-heading text-lg font-bold text-primary">Recent report runs</h2>
            {reportLog.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No reports sent yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {reportLog.map((log) => (
                  <li key={log.id} className="rounded-lg bg-muted-bg px-4 py-3 text-sm">
                    <p className="font-semibold text-primary">
                      {log.report_date} · {log.order_count} orders · {formatINR(log.total_value)}
                    </p>
                    <p className="mt-0.5 break-all text-xs text-muted">{log.delivery}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
