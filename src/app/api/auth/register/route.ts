import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = (await request.json()) as { email?: string; password?: string };
  const email = payload.email?.trim() || "";
  const password = payload.password || "";

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password required" }, { status: 400 });
  }

  const result = await createUser(email, password);
  if (!result.ok) {
    return NextResponse.json({ message: "Account already exists" }, { status: 409 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
