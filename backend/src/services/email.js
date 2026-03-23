const nodemailer = require("nodemailer");
const { env } = require("../config/env");

function createTransport() {
  if (!env.EMAIL_HOST || !env.EMAIL_USER || !env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT || 587),
    secure: false,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
}

async function sendBookingConfirmation({ toEmail, subject, text }) {
  const transport = createTransport();
  if (!transport) {
    // In dev/without SMTP config, don't fail booking flow.
    return { skipped: true };
  }

  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: toEmail,
    subject,
    text,
  });

  return { skipped: false };
}

module.exports = { sendBookingConfirmation };

