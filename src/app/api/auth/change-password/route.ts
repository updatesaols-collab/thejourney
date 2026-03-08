import { NextRequest, NextResponse } from "next/server";
import { changeUserPassword } from "@/lib/auth";
import { requireUser } from "@/lib/requestAuth";

export async function POST(request: NextRequest) {
  const user = requireUser(request);
  if (!user.ok) return user.response;

  const payload = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };

  const currentPassword = payload.currentPassword || "";
  const newPassword = payload.newPassword || "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: "Passwords required" }, { status: 400 });
  }

  const result = await changeUserPassword(user.subject, currentPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json(
      { message: "Current password is incorrect" },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
