import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";

export async function POST(request: Request) {
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

  return NextResponse.json({ ok: true });
}
