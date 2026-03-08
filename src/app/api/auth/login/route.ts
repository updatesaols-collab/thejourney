import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import { attachUserSession } from "@/lib/requestAuth";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { email?: string; password?: string };
  const email = payload.email?.trim() || "";
  const password = payload.password || "";

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password required" }, { status: 400 });
  }

  const result = await authenticateUser(email, password);
  if (!result.ok) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  attachUserSession(response, email);
  return response;
}
