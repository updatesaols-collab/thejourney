import { NextResponse } from "next/server";
import { changeUserPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const email = payload.email?.trim() || "";
  const currentPassword = payload.currentPassword || "";
  const newPassword = payload.newPassword || "";

  if (!email || !currentPassword || !newPassword) {
    return NextResponse.json(
      { message: "Email and passwords required" },
      { status: 400 }
    );
  }

  const result = await changeUserPassword(email, currentPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json(
      { message: "Current password is incorrect" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
