/**
 * Daily report scheduler.
 *
 * Runs alongside the Next.js server (`npm run scheduler`) and triggers the
 * report endpoint once a day at the hour configured in Admin → Report settings
 * (checked every minute, so changes apply without restart).
 *
 * For serverless hosting, use a platform cron instead — see vercel.json /
 * README "Deploying" section.
 */
import cron from "node-cron";

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET || "";
const IST = "Asia/Kolkata";

let lastSentDate = null;

// The rest of the app treats "day" as an IST calendar day (lib/db.ts istToday/
// istHour) — this scheduler has to match, since it may run on a host in any
// timezone (that's the whole point of it existing alongside the embedded one).
function istToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date());
}

function istHour() {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "numeric", hour12: false }).format(
      new Date()
    )
  );
}

async function getConfiguredHour() {
  try {
    const res = await fetch(`${BASE_URL}/api/settings`);
    const data = await res.json();
    const hour = Number(data.reportHour);
    return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 18;
  } catch {
    return 18;
  }
}

async function sendReport() {
  const url = new URL("/api/report/send", BASE_URL);
  if (CRON_SECRET) url.searchParams.set("secret", CRON_SECRET);
  // GET (not POST): this scheduler fires automatically like a cron job, so the
  // endpoint's once-per-day dedupe should apply — it may run alongside the
  // Render embedded scheduler or Vercel Cron against the same database.
  const res = await fetch(url, { method: "GET" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  console.log(
    `[scheduler] Report sent for ${data.date}: ${data.orderCount} orders, ` +
      `₹${data.totalValue.toLocaleString("en-IN")} → ${data.recipient}` +
      (data.delivered ? "" : ` (${data.detail})`)
  );
}

console.log(`[scheduler] Watching ${BASE_URL} — daily report fires at the hour set in Admin.`);

cron.schedule("* * * * *", async () => {
  const today = istToday();
  if (lastSentDate === today) return;

  const hour = await getConfiguredHour();
  if (istHour() < hour) return;

  try {
    await sendReport();
    lastSentDate = today;
  } catch (err) {
    console.error(`[scheduler] Failed to send report: ${err.message} — retrying next minute.`);
  }
});
