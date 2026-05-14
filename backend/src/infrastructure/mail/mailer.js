import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const placeholderValues = new Set([
  "your-email@gmail.com",
  "your-gmail-app-password",
]);

const hasSmtp = Boolean(
  env.smtpHost &&
    env.smtpUser &&
    env.smtpPass &&
    !placeholderValues.has(env.smtpUser) &&
    !placeholderValues.has(env.smtpPass),
);

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
      tls: {
        rejectUnauthorized: env.smtpTlsRejectUnauthorized,
      },
    })
  : null;

export async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    logger.info("Email transport not configured; logging email payload", {
      to,
      subject,
      previewText: text?.slice(0, 120),
    });
    return { accepted: [to], mocked: true };
  }

  const info = await transporter.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
    text,
  });

  return info;
}
