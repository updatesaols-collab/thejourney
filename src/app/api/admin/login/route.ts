import { NextRequest, NextResponse } from "next/server";
import { clearAdminForcedLogout } from "@/lib/requestAuth";

const ADMIN_SESSION_COOKIE = "journey_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as LoginPayload;
  const username = payload.username?.trim() || "";
  const password = payload.password || "";

  if (!username || !password) {
    return NextResponse.json(
      { message: "Username and password are required." },
      { status: 400 }
    );
  }

  const expectedUser = process.env.ADMIN_ACCESS_USER || "admin";
  const expectedPassword = process.env.ADMIN_ACCESS_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json(
      { message: "Admin password is not configured." },
      { status: 500 }
    );
  }

  if (username !== expectedUser || password !== expectedPassword) {
    return NextResponse.json({ message: "Invalid admin credentials." }, { status: 401 });
  }

  const encoded = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, `basic:${encoded}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  clearAdminForcedLogout(response);
  return response;
}

