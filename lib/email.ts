import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// ─── Helpers ────────────────────────────────────────────────────────────────

function asBool(value: string | undefined): boolean {
  return value === "true";
}

// ─── Singleton transporter (lazy) ───────────────────────────────────────────

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  // Developer override: use JSON transport (prints email as JSON to console)
  if (asBool(process.env.SMTP_USE_JSON_TRANSPORT)) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  // All four SMTP vars present → use real SMTP
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: asBool(process.env.SMTP_SECURE),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Not in production and SMTP not configured → fall back silently to JSON
  if (process.env.NODE_ENV !== "production") {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    console.warn("SMTP is not configured. Falling back to JSON transport in development.");
    return transporter;
  }

  throw new Error(
    "Email service is not configured. Set SMTP credentials in .env."
  );
}

// ─── Email payload types ─────────────────────────────────────────────────────

export type SendCredentialsOptions = {
  to: string;
  fullName: string;
  companyName: string;
  role: string;
  temporaryPassword: string;
  loginId: string;
  createdBy?: string;
};

// ─── Main send function ──────────────────────────────────────────────────────

/**
 * Sends login credentials to a newly created employee.
 *
 * In development:
 *   - If SMTP delivery fails, falls back to JSON transport and logs to console.
 * In production:
 *   - Throws on failure so the caller can handle it explicitly.
 *
 * Returns true when SMTP delivery succeeded, false when JSON fallback was used.
 */
export async function sendCredentialsEmail(
  options: SendCredentialsOptions
): Promise<boolean> {
  const {
    to,
    fullName,
    companyName,
    role,
    temporaryPassword,
    loginId,
    createdBy = "Admin",
  } = options;

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "no-reply@empay.local";

  const subject = `${companyName} — Your EmPay Access Credentials`;

  const signinUrl = `${(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "")}/login`;

  const text = [
    `Hello ${fullName},`,
    "",
    `Your EmPay account has been created for ${companyName}.`,
    `Role              : ${role}`,
    `Login ID          : ${loginId}`,
    `Email             : ${to}`,
    `Temporary Password: ${temporaryPassword}`,
    "",
    `Sign in at: ${signinUrl}`,
    "Please sign in and change your password as soon as possible.",
    `Created by: ${createdBy}`,
  ].join("\n");

  const html = `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff7f9;border-radius:12px;border:1px solid #d1c3ca;">
      <h2 style="color:#714b67;margin:0 0 8px 0;">Welcome to ${companyName}!</h2>
      <p style="color:#4e444a;margin:0 0 20px 0;">Hello <strong>${fullName}</strong>, your EmPay account has been created.</p>

      <div style="background:#ffffff;border:1px solid #d1c3ca;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#80747a;font-size:14px;width:130px;">Role</td>
            <td style="padding:8px 0;color:#1e1b1d;font-weight:600;font-size:14px;">${role}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#80747a;font-size:14px;">Login ID</td>
            <td style="padding:8px 0;color:#1e1b1d;font-weight:700;font-family:monospace;font-size:16px;letter-spacing:1px;">${loginId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#80747a;font-size:14px;">Email</td>
            <td style="padding:8px 0;color:#1e1b1d;font-size:14px;">${to}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#80747a;font-size:14px;">Temp. Password</td>
            <td style="padding:8px 0;color:#1e1b1d;font-weight:700;font-family:monospace;font-size:16px;">${temporaryPassword}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 12px 0;">
        <a href="${signinUrl}" style="display:inline-block;background:#714b67;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">Sign In to EmPay</a>
      </p>
      <p style="color:#80747a;font-size:13px;margin:0;">Please change your password after your first login. Created by: ${createdBy}</p>
    </div>
  `;

  const mailOptions = { from, to, subject, text, html };

  let info: any;

  try {
    const activeTransporter = getTransporter();
    info = await activeTransporter.sendMail(mailOptions);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error; // let the caller handle it in prod
    }

    // Development: fall back to JSON transport so we can at least log it
    console.warn("SMTP delivery failed in development. Falling back to JSON transport.", error);
    transporter = nodemailer.createTransport({ jsonTransport: true });
    info = await transporter.sendMail(mailOptions);
  }

  // JSON transport → log the preview in dev; return false = "not really sent"
  if (info?.message && process.env.NODE_ENV !== "production") {
    console.log("📧 Credential email (JSON transport preview):\n", info.message.toString());
    return false;
  }

  return true;
}

export type SendPasswordResetOptions = {
  to: string;
  fullName: string;
  resetLink: string;
};

export async function sendPasswordResetEmail(
  options: SendPasswordResetOptions
): Promise<boolean> {
  const { to, fullName, resetLink } = options;

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "no-reply@empay.local";

  const subject = `EmPay — Password Reset Request`;

  const text = [
    `Hello ${fullName},`,
    "",
    `We received a request to change your password for your EmPay account.`,
    `Click the link below to set a new password. This link is valid for 2 hours.`,
    "",
    resetLink,
    "",
    "If you didn't request this, please ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fff7f9;border-radius:12px;border:1px solid #d1c3ca;">
      <h2 style="color:#714b67;margin:0 0 8px 0;">Password Reset</h2>
      <p style="color:#4e444a;margin:0 0 20px 0;">Hello <strong>${fullName}</strong>,</p>
      <p style="color:#4e444a;margin:0 0 20px 0;">We received a request to change your password. Click the button below to set a new password. This link is valid for 2 hours.</p>

      <p style="margin:0 0 24px 0;text-align:center;">
        <a href="${resetLink}" style="display:inline-block;background:#714b67;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">Reset Password</a>
      </p>

      <p style="color:#80747a;font-size:13px;margin:0;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  const mailOptions = { from, to, subject, text, html };

  let info: any;

  try {
    const activeTransporter = getTransporter();
    info = await activeTransporter.sendMail(mailOptions);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    console.warn("SMTP delivery failed in development. Falling back to JSON transport.", error);
    transporter = nodemailer.createTransport({ jsonTransport: true });
    info = await transporter.sendMail(mailOptions);
  }

  if (info?.message && process.env.NODE_ENV !== "production") {
    console.log("📧 Password Reset email (JSON transport preview):\n", info.message.toString());
    return false;
  }

  return true;
}
