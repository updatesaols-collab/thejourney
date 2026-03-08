import { NextResponse } from "next/server";
import { clearAdminForcedLogout } from "@/lib/requestAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAdminForcedLogout(response);
  return response;
}

