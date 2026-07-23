import { getSetting, istToday } from "./db";
import { getOrdersForDate, countOrdersForDate, logReport } from "./queries";
import { sendEmail, SendResult } from "./email";
import type { Order } from "./types";

const NAVY = "#0F172A";
const BLUE = "#0369A1";
const SLATE = "#64748B";
const BG = "#F1F5F9";

function inr(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN");
}

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface BrandRollup {
  brand: string;
  units: number;
  value: number;
}

interface ProductRollup {
  name: string;
  brand: string;
  units: number;
  value: number;
}

function rollup(orders: Order[]) {
  const brands = new Map<string, BrandRollup>();
  const products = new Map<string, ProductRollup>();
  let units = 0;

  for (const order of orders) {
    for (const item of order.items ?? []) {
      units += item.quantity;
      const b = brands.get(item.brand_name) ?? { brand: item.brand_name, units: 0, value: 0 };
      b.units += item.quantity;
      b.value += item.line_total;
      brands.set(item.brand_name, b);

      const key = `${item.product_name} (${item.grade})`;
      const p = products.get(key) ?? { name: key, brand: item.brand_name, units: 0, value: 0 };
      p.units += item.quantity;
      p.value += item.line_total;
      products.set(key, p);
    }
  }

  return {
    units,
    brands: [...brands.values()].sort((a, b) => b.value - a.value),
    topProducts: [...products.values()].sort((a, b) => b.value - a.value).slice(0, 5),
  };
}

function statCard(label: string, value: string, sub: string): string {
  return `
    <td width="33%" style="padding:0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E2E8F0;border-radius:10px;">
        <tr><td style="padding:18px 20px;">
          <p style="margin:0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${SLATE};font-weight:700;">${label}</p>
          <p style="margin:6px 0 2px;font-size:28px;line-height:1.1;color:${NAVY};font-weight:700;">${value}</p>
          <p style="margin:0;font-size:12px;color:${SLATE};">${sub}</p>
        </td></tr>
      </table>
    </td>`;
}

function buildOrderBlock(order: Order, index: number): string {
  const rows = (order.items ?? [])
    .map(
      (item) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:${NAVY};">
          ${esc(item.product_name)}
          <span style="color:${SLATE};">· ${esc(item.grade)} · ${esc(item.packaging)}</span><br>
          <span style="font-size:11px;color:${BLUE};font-weight:600;">${esc(item.brand_name)}</span>
        </td>
        <td align="center" style="padding:9px 8px;border-bottom:1px solid #F1F5F9;font-size:13px;color:${SLATE};white-space:nowrap;">${item.quantity} kg × ${inr(item.unit_price)}/kg</td>
        <td align="right" style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:${NAVY};font-weight:700;white-space:nowrap;">${inr(item.line_total)}</td>
      </tr>`
    )
    .join("");

  const time = new Date(order.created_at.replace(" ", "T")).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:14px;">
      <tr>
        <td style="padding:16px 22px 12px;border-bottom:2px solid ${BG};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <p style="margin:0;font-size:15px;color:${NAVY};font-weight:700;">${index}. ${esc(order.company_name)}</p>
              <p style="margin:3px 0 0;font-size:12px;color:${SLATE};">
                ${esc(order.contact_name)} · ${esc(order.email)} · ${esc(order.phone)}${order.gstin ? " · GSTIN " + esc(order.gstin) : ""}
              </p>
            </td>
            <td align="right" style="vertical-align:top;">
              <p style="margin:0;font-size:12px;color:${SLATE};">${esc(order.order_number)}</p>
              <p style="margin:3px 0 0;font-size:12px;color:${SLATE};">${time}</p>
            </td>
          </tr></table>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 22px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
            <tr>
              <td colspan="2" style="padding:11px 0 2px;font-size:13px;color:${SLATE};">Subtotal ${inr(order.subtotal)} &nbsp;+&nbsp; GST (18%) ${inr(order.tax)}</td>
              <td align="right" style="padding:11px 0 2px;font-size:16px;color:${BLUE};font-weight:700;white-space:nowrap;">${inr(order.total)}</td>
            </tr>
          </table>
          ${order.notes ? `<p style="margin:10px 0 0;padding:10px 14px;background:${BG};border-radius:8px;font-size:12px;color:${SLATE};"><strong style="color:${NAVY};">Customer note:</strong> ${esc(order.notes)}</p>` : ""}
        </td>
      </tr>
    </table>`;
}

export function buildReportHtml(
  date: string,
  orders: Order[],
  yesterdayCount: number,
  companyName: string
): string {
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);
  const { units, brands, topProducts } = rollup(orders);

  const displayDate = new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const trend =
    yesterdayCount === 0
      ? orders.length > 0
        ? "That's a fresh start compared to yesterday, which had no orders."
        : ""
      : orders.length >= yesterdayCount
        ? `That's ${orders.length === yesterdayCount ? "level with" : `up from ${yesterdayCount} order${yesterdayCount === 1 ? "" : "s"}`} yesterday — good momentum.`
        : `That's down from ${yesterdayCount} order${yesterdayCount === 1 ? "" : "s"} yesterday — worth keeping an eye on.`;

  const summaryLine =
    orders.length === 0
      ? `No orders came in today. ${trend}`
      : `You received <strong>${orders.length} order${orders.length === 1 ? "" : "s"}</strong> today worth <strong>${inr(revenue)}</strong> across <strong>${units.toLocaleString("en-IN")} kg</strong>. ${trend}`;

  const brandRows = brands
    .map(
      (b, i) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:${NAVY};font-weight:${i === 0 ? 700 : 400};">${i + 1}. ${esc(b.brand)}</td>
        <td align="center" style="padding:9px 8px;border-bottom:1px solid #F1F5F9;font-size:13px;color:${SLATE};">${b.units.toLocaleString("en-IN")} kg</td>
        <td align="right" style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:${NAVY};font-weight:700;">${inr(b.value)}</td>
      </tr>`
    )
    .join("");

  const productRows = topProducts
    .map(
      (p, i) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:${NAVY};">${i + 1}. ${esc(p.name)}<br><span style="font-size:11px;color:${BLUE};font-weight:600;">${esc(p.brand)}</span></td>
        <td align="center" style="padding:9px 8px;border-bottom:1px solid #F1F5F9;font-size:13px;color:${SLATE};">${p.units.toLocaleString("en-IN")} kg</td>
        <td align="right" style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:13px;color:${NAVY};font-weight:700;">${inr(p.value)}</td>
      </tr>`
    )
    .join("");

  const sectionTitle = (title: string) =>
    `<p style="margin:28px 0 12px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${SLATE};font-weight:700;">${title}</p>`;

  const emptyState = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px dashed #CBD5E1;border-radius:10px;">
      <tr><td align="center" style="padding:36px 24px;">
        <p style="margin:0;font-size:15px;color:${NAVY};font-weight:700;">No orders today</p>
        <p style="margin:6px 0 0;font-size:13px;color:${SLATE};">A quiet day on the order desk. This report will keep arriving daily so nothing slips through.</p>
      </td></tr>
    </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daily Order Report</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

        <tr><td style="background:${NAVY};border-radius:12px 12px 0 0;padding:28px 32px;">
          <table role="presentation" width="100%"><tr>
            <td>
              <p style="margin:0;font-size:20px;color:#ffffff;font-weight:700;letter-spacing:0.5px;">${esc(companyName)}</p>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Daily Order Report</p>
            </td>
            <td align="right" style="vertical-align:middle;">
              <p style="margin:0;font-size:13px;color:#CBD5E1;">${displayDate}</p>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="background:#ffffff;padding:28px 32px 8px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
          <p style="margin:0 0 6px;font-size:16px;color:${NAVY};font-weight:700;">Good evening,</p>
          <p style="margin:0;font-size:14px;line-height:1.65;color:#334155;">
            Here is your end-of-day summary for <strong>${displayDate}</strong>. ${summaryLine}
          </p>
        </td></tr>

        <tr><td style="background:#ffffff;padding:22px 26px 4px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            ${statCard("Orders", String(orders.length), "placed today")}
            ${statCard("Revenue", inr(revenue), "incl. 18% GST")}
            ${statCard("Volume", `${units.toLocaleString("en-IN")} kg`, "across all brands")}
          </tr></table>
        </td></tr>

        <tr><td style="background:#ffffff;padding:4px 32px 28px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
          ${
            orders.length === 0
              ? sectionTitle("Today at a glance") + emptyState
              : `
          ${sectionTitle("Sales by brand")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <th align="left" style="padding:0 0 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${SLATE};">Brand</th>
              <th align="center" style="padding:0 8px 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${SLATE};">Volume</th>
              <th align="right" style="padding:0 0 8px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${SLATE};">Value</th>
            </tr>
            ${brandRows}
          </table>

          ${sectionTitle("Top products")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${productRows}</table>

          ${sectionTitle(`Order details (${orders.length})`)}
          ${orders.map((o, i) => buildOrderBlock(o, i + 1)).join("")}
          `
          }
        </td></tr>

        <tr><td style="background:${NAVY};border-radius:0 0 12px 12px;padding:20px 32px;">
          <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.6;">
            This report was generated automatically by the ${esc(companyName)} order desk at end of day.<br>
            To change the recipient or send time, open <strong style="color:#CBD5E1;">Admin → Report settings</strong> on the website.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export interface ReportRunResult extends SendResult {
  date: string;
  recipient: string;
  orderCount: number;
  totalValue: number;
}

/** Builds and sends the daily report for the given IST date (defaults to today in IST). */
export async function runDailyReport(date?: string): Promise<ReportRunResult> {
  const targetDate = date || istToday();
  const yesterday = new Date(new Date(`${targetDate}T12:00:00Z`).getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10);

  const orders = await getOrdersForDate(targetDate);
  const yesterdayCount = await countOrdersForDate(yesterday);

  const recipient = (await getSetting("report_email")) || "yuvraajbhatter10@gmail.com";
  const companyName = (await getSetting("company_name")) || "ChemCorp Industries";
  const html = buildReportHtml(targetDate, orders, yesterdayCount, companyName);
  const revenue = orders.reduce((sum, o) => sum + o.total, 0);

  const displayDate = new Date(targetDate + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const result = await sendEmail({
    to: recipient,
    subject: `Daily Order Report — ${displayDate} · ${orders.length} order${orders.length === 1 ? "" : "s"} · ₹${revenue.toLocaleString("en-IN")}`,
    html,
  });

  await logReport({
    date: targetDate,
    recipient,
    orderCount: orders.length,
    totalValue: revenue,
    delivery: result.detail,
  });

  return {
    ...result,
    date: targetDate,
    recipient,
    orderCount: orders.length,
    totalValue: revenue,
  };
}
