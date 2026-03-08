import { NextRequest, NextResponse } from "next/server";
import { getProgramBySlug } from "@/lib/programs";
import { requireUser } from "@/lib/requestAuth";
import { sendProgramInvitationEmail } from "@/lib/mailer";

type InvitationPayload = {
  inviterName?: string;
  recipientFullName?: string;
  recipientEmail?: string;
  programSlug?: string;
};

const normalize = (value?: string) => (value || "").trim();

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const getBaseUrl = (request: NextRequest) => {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.APP_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  return request.nextUrl.origin;
};

export async function POST(request: NextRequest) {
  const user = requireUser(request);
  if (!user.ok) return user.response;

  try {
    const payload = (await request.json()) as InvitationPayload;

    const inviterName = normalize(payload.inviterName) || user.subject;
    const recipientFullName = normalize(payload.recipientFullName);
    const recipientEmail = normalize(payload.recipientEmail).toLowerCase();
    const programSlug = normalize(payload.programSlug);

    if (!recipientFullName || !recipientEmail || !programSlug) {
      return NextResponse.json(
        { message: "Recipient name, recipient email, and program are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(recipientEmail)) {
      return NextResponse.json({ message: "Enter a valid recipient email." }, { status: 400 });
    }

    const program = await getProgramBySlug(programSlug);
    if (!program) {
      return NextResponse.json({ message: "Program not found." }, { status: 404 });
    }

    const baseUrl = getBaseUrl(request);
    const registerLink = `${baseUrl}/programs/${program.slug}#register-modal`;

    await sendProgramInvitationEmail({
      inviterName,
      recipientName: recipientFullName,
      recipientEmail,
      programTitle: program.title,
      registerLink,
    });

    return NextResponse.json({ message: "Invitation sent successfully." });
  } catch {
    return NextResponse.json({ message: "Unable to send invitation right now." }, { status: 500 });
  }
}
