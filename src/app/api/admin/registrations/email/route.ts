import { NextResponse } from "next/server";
import { sendAdminEmail } from "@/lib/mailer";
import { requireAdmin } from "@/lib/requestAuth";

export const runtime = "nodejs";

type Recipient = {
  email: string;
  name?: string;
};

type SendEmailPayload = {
  subject?: string;
  messageHtml?: string;
  recipients?: Recipient[];
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const payload = (await request.json()) as SendEmailPayload;
  const subject = payload.subject?.trim() || "";
  const messageHtml = payload.messageHtml?.trim() || "";
  const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];

  if (!subject) {
    return NextResponse.json({ message: "Subject is required." }, { status: 400 });
  }
  if (!messageHtml) {
    return NextResponse.json({ message: "Message is required." }, { status: 400 });
  }
  if (recipients.length === 0) {
    return NextResponse.json({ message: "Recipients are required." }, { status: 400 });
  }

  const validRecipients = recipients
    .map((recipient) => ({
      email: recipient.email?.trim().toLowerCase() || "",
      name: recipient.name?.trim() || "",
    }))
    .filter((recipient) => EMAIL_REGEX.test(recipient.email));

  if (validRecipients.length === 0) {
    return NextResponse.json({ message: "No valid email recipients found." }, { status: 400 });
  }

  try {
    const result = await sendAdminEmail({
      recipients: validRecipients,
      subject,
      html: messageHtml,
    });

    if (result.sent === 0) {
      return NextResponse.json(
        { message: "Unable to send email to recipients." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Email service not configured") {
        return NextResponse.json(
          { message: "Email service not configured." },
          { status: 500 }
        );
      }
      const validationMessages = new Set([
        "Email subject and message are required",
        "No valid recipients found",
      ]);
      if (validationMessages.has(error.message)) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Unable to send emails." }, { status: 500 });
  }
}
