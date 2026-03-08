import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminSession,
  requireAdmin,
  setAdminForcedLogout,
} from "@/lib/requestAuth";

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const response = NextResponse.json({ ok: true });
  clearAdminSession(response);
  setAdminForcedLogout(response);
  return response;
}
