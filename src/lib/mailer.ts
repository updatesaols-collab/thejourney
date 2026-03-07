import nodemailer from "nodemailer";

type SendResetEmailParams = {
  to: string;
  resetLink: string;
};

const getTransport = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

export const sendPasswordResetEmail = async ({ to, resetLink }: SendResetEmailParams) => {
  const transporter = getTransport();
  if (!transporter) {
    throw new Error("Email service not configured");
  }

  const fromName = process.env.MAIL_FROM_NAME || "The Journey";
  const fromAddress = process.env.GMAIL_USER;

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject: "Reset your The Journey password",
    text: [
      "We received a request to reset your password.",
      `Reset your password using this link: ${resetLink}`,
      "If you did not request this, you can ignore this email.",
    ].join("\n\n"),
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
};
