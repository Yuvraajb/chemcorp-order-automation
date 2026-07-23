"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Save, CheckCircle2, AlertTriangle, PackageCheck } from "lucide-react";

export function ReportSettingsForm({
  initialEmail,
  initialHour,
}: {
  initialEmail: string;
  initialHour: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [hour, setHour] = useState(initialHour);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportEmail: email, reportHour: hour }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save settings.");
      setMessage({ ok: true, text: "Settings saved. The next report goes to this address." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label htmlFor="reportEmail" className="mb-1.5 block text-sm font-bold text-primary">
          Report recipient email
        </label>
        <input
          id="reportEmail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <p className="mt-1.5 text-xs text-muted">
          The end-of-day order report is emailed to this address.
        </p>
      </div>
      <div>
        <label htmlFor="reportHour" className="mb-1.5 block text-sm font-bold text-primary">
          Send time (hour of day)
        </label>
        <select
          id="reportHour"
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          className="h-12 w-full cursor-pointer rounded-lg border border-border bg-background px-4 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={String(i)}>
              {String(i).padStart(2, "0")}:00
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted">
          Used by the scheduler (`npm run scheduler`). Default 18:00 IST.
        </p>
      </div>

      {message && (
        <p
          role="status"
          className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-semibold ${
            message.ok
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-destructive"
          }`}
        >
          {message.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-primary-light disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        Save settings
      </button>
    </form>
  );
}

export function MarkFulfilledButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function markFulfilled() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "fulfilled" }),
      });
      if (!res.ok) throw new Error("Could not update order status.");
      router.refresh();
    } catch {
      setUpdating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={markFulfilled}
      disabled={updating}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-bold text-primary transition-colors hover:border-success hover:text-success disabled:opacity-60"
    >
      {updating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      Mark fulfilled
    </button>
  );
}

export function SendReportButton() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/report/send", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report failed.");
      setResult({
        ok: true,
        text: data.delivered
          ? `Report for ${data.date} (${data.orderCount} orders) delivered to ${data.recipient}.`
          : data.detail,
      });
      router.refresh();
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : "Report failed." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={send}
        disabled={sending}
        className="flex h-11 items-center gap-2 rounded-lg bg-accent px-6 text-sm font-bold text-white transition-colors duration-200 hover:bg-accent-dark disabled:opacity-60"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
        {sending ? "Generating…" : "Send today's report now"}
      </button>
      {result && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-4 py-3 text-sm font-semibold ${
            result.ok
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-destructive"
          }`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
