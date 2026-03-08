import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/requestAuth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearUserSession(response);
  return response;
}

