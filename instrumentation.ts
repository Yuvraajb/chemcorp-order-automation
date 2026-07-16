/**
 * Runs once when the server starts (Next.js instrumentation hook).
 * Hosts the daily-report scheduler inside the web process so single-process
 * deployments (Render, a VPS) need no separate scheduler worker.
 *
 * Every minute: if the configured send hour (IST) has passed and no report has
 * been logged for today, send it. Dedupe is via the report_log table, so
 * restarts and multiple instances don't double-send.
 *
 * On serverless (Vercel), long-lived intervals don't survive between requests —
 * there, the daily report fires via Vercel Cron hitting /api/report/send
 * (see vercel.json). The dedupe below makes it safe to run both.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_EMBEDDED_SCHEDULER === "1") return;
  if (process.env.VERCEL) return; // Vercel Cron handles it there

  const { getSetting, istToday, istHour } = await import("./lib/db");
  const { hasReportForDate } = await import("./lib/queries");
  const { runDailyReport } = await import("./lib/report");

  console.log("[scheduler] Embedded daily-report scheduler active (IST).");

  setInterval(async () => {
    try {
      const hour = Number((await getSetting("report_hour")) ?? "18");
      if (istHour() < hour) return;

      const today = istToday();
      if (await hasReportForDate(today)) return;

      const result = await runDailyReport(today);
      console.log(
        `[scheduler] Daily report for ${today}: ${result.orderCount} orders → ${result.recipient} (${result.detail})`
      );
    } catch (err) {
      console.error("[scheduler] Report attempt failed:", err);
    }
  }, 60_000);
}
