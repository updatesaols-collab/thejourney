import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = (await request.json()) as { token?: string; password?: string };
  const token = payload.token?.trim() || "";
  const password = payload.password || "";

  if (!token || !password) {
    return NextResponse.json({ message: "Token and password required" }, { status: 400 });
  }

  const result = await resetPasswordWithToken(token, password);
  if (!result.ok) {
    return NextResponse.json({ message: "Invalid or expired reset link" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
