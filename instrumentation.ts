/**
 * Runs once when the server starts (Next.js instrumentation hook).
 * Hosts the daily-report scheduler inside the web process so single-process
 * deployments (Render free tier, etc.) need no separate scheduler worker.
 *
 * Every minute: if the configured send hour has passed and no report has been
 * logged for today, send it. Dedupe is via the report_log table, so restarts
 * don't double-send. Set TZ=Asia/Kolkata in production so "today" and the
 * send hour follow IST.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_EMBEDDED_SCHEDULER === "1") return;

  const { getDb, getSetting } = await import("./lib/db");
  const { runDailyReport } = await import("./lib/report");

  console.log("[scheduler] Embedded daily-report scheduler active.");

  setInterval(async () => {
    try {
      const db = getDb();
      const hour = Number(getSetting("report_hour") ?? "18");
      if (new Date().getHours() < hour) return;

      const today = (db.prepare("SELECT date('now', 'localtime') AS d").get() as { d: string }).d;
      const already = db
        .prepare("SELECT 1 FROM report_log WHERE report_date = ? LIMIT 1")
        .get(today);
      if (already) return;

      const result = await runDailyReport(today);
      console.log(
        `[scheduler] Daily report for ${today}: ${result.orderCount} orders → ${result.recipient} (${result.detail})`
      );
    } catch (err) {
      console.error("[scheduler] Report attempt failed:", err);
    }
  }, 60_000);
}
