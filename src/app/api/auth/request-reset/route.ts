import { NextResponse } from "next/server";
import { createPasswordReset } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: string };
  const email = payload.email?.trim() || "";

  if (!email) {
    return NextResponse.json({ message: "Email required" }, { status: 400 });
  }

  const token = await createPasswordReset(email);
  if (token) {
    const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin;
    const resetLink = `${baseUrl}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail({ to: email, resetLink });
    } catch (error) {
      console.error("Password reset email failed", error);
      if (error instanceof Error && error.message === "Email service not configured") {
        return NextResponse.json(
          { message: "Email service not configured" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { message: "Email authentication failed. Check your Gmail credentials." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
