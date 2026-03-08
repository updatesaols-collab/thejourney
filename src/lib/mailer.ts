import nodemailer from "nodemailer";

type SendResetEmailParams = {
  to: string;
  resetLink: string;
};

type AdminRecipient = {
  email: string;
  name?: string;
};

type SendAdminEmailParams = {
  recipients: AdminRecipient[];
  subject: string;
  html: string;
};

type SendProgramInvitationEmailParams = {
  inviterName: string;
  recipientName: string;
  recipientEmail: string;
  programTitle: string;
  registerLink: string;
};

const getTransport = () => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
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

const htmlToText = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const sendAdminEmail = async ({
  recipients,
  subject,
  html,
}: SendAdminEmailParams) => {
  const transporter = getTransport();
  if (!transporter) {
    throw new Error("Email service not configured");
  }

  const cleanSubject = subject.trim();
  const cleanHtml = html.trim();
  const text = htmlToText(cleanHtml);
  if (!cleanSubject || !text) {
    throw new Error("Email subject and message are required");
  }

  const deduped = new Map<string, AdminRecipient>();
  for (const recipient of recipients) {
    const normalized = normalizeEmail(recipient.email || "");
    if (!normalized || !isValidEmail(normalized)) continue;
    if (!deduped.has(normalized)) {
      deduped.set(normalized, {
        email: normalized,
        name: recipient.name?.trim() || "",
      });
    }
  }

  const toSend = Array.from(deduped.values());
  if (toSend.length === 0) {
    throw new Error("No valid recipients found");
  }

  const fromName = process.env.MAIL_FROM_NAME || "The Journey";
  const fromAddress = process.env.GMAIL_USER;
  if (!fromAddress) {
    throw new Error("Email service not configured");
  }

  const batchSize = 50;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < toSend.length; i += batchSize) {
    const batch = toSend.slice(i, i + batchSize);
    const bcc = batch
      .map((recipient) =>
        recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email
      )
      .join(", ");

    try {
      await transporter.sendMail({
        from: `${fromName} <${fromAddress}>`,
        to: `${fromName} <${fromAddress}>`,
        bcc,
        subject: cleanSubject,
        text,
        html: cleanHtml,
      });
      sent += batch.length;
    } catch {
      failed += batch.length;
    }
  }

  if (sent === 0) {
    throw new Error("Unable to send email to recipients");
  }

  return {
    sent,
    failed,
  };
};

export const sendProgramInvitationEmail = async ({
  inviterName,
  recipientName,
  recipientEmail,
  programTitle,
  registerLink,
}: SendProgramInvitationEmailParams) => {
  const transporter = getTransport();
  if (!transporter) {
    throw new Error("Email service not configured");
  }

  const cleanRecipientEmail = normalizeEmail(recipientEmail);
  if (!isValidEmail(cleanRecipientEmail)) {
    throw new Error("Invalid recipient email");
  }

  const cleanInviterName = inviterName.trim() || "A friend";
  const cleanRecipientName = recipientName.trim() || "Friend";
  const cleanProgramTitle = programTitle.trim() || "this program";
  const cleanRegisterLink = registerLink.trim();

  if (!cleanRegisterLink) {
    throw new Error("Missing register link");
  }

  const subject = `${cleanInviterName} invited you to join ${cleanProgramTitle}`;
  const fromName = process.env.MAIL_FROM_NAME || "The Journey";
  const fromAddress = process.env.GMAIL_USER;
  if (!fromAddress) {
    throw new Error("Email service not configured");
  }

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;max-width:620px;margin:0 auto;">
      <p>Dear ${cleanRecipientName},</p>
      <p>${cleanInviterName} has invited you to join <strong>${cleanProgramTitle}</strong>.</p>
      <p>Register yourself to reserve your place.</p>
      <p style="margin:24px 0;">
        <a href="${cleanRegisterLink}" style="display:inline-block;background:#1f6b5b;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Register now</a>
      </p>
      <p>With warmth,<br/>Journey - The Art of Living</p>
    </div>
  `;

  const text = [
    `Dear ${cleanRecipientName},`,
    `${cleanInviterName} has invited you to join ${cleanProgramTitle}.`,
    "Register yourself to reserve your place:",
    cleanRegisterLink,
    "",
    "With warmth,",
    "Journey - The Art of Living",
  ].join("\n");

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: cleanRecipientEmail,
    subject,
    text,
    html,
  });
};
