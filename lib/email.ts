import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export interface SendResult {
  delivered: boolean;
  detail: string;
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Sends an HTML email via SMTP. If SMTP env vars are not configured, the
 * rendered email is saved to ./reports/ so the automation still completes
 * and the output can be previewed in a browser.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!isSmtpConfigured()) {
    // Vercel's filesystem is read-only outside /tmp.
    const dir = process.env.VERCEL
      ? path.join("/tmp", "reports")
      : path.join(process.cwd(), "reports");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(
      dir,
      `report-${new Date().toISOString().replace(/[:.]/g, "-")}.html`
    );
    fs.writeFileSync(file, opts.html);
    return {
      delivered: false,
      detail: `SMTP not configured — report saved to ${file}. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable delivery.`,
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || `"ChemCorp Orders" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  return { delivered: true, detail: `Delivered to ${opts.to} (id: ${info.messageId})` };
}
