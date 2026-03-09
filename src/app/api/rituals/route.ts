import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createRitual, listRituals } from "@/lib/rituals";
import { requireAdmin, requireUser } from "@/lib/requestAuth";
import type { RitualRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  const user = requireUser(request);

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const requestedUserId = searchParams.get("userId")?.trim() || "";
  const limit = Number(searchParams.get("limit") || "");

  if (!admin.ok && !user.ok) {
    return user.response;
  }

  const userId = admin.ok ? requestedUserId || undefined : user.ok ? user.subject : undefined;

  const rituals = await listRituals({
    q: q || undefined,
    userId,
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
  });

  return NextResponse.json(rituals);
}

export async function POST(request: NextRequest) {
  const user = requireUser(request);
  if (!user.ok) return user.response;

  const payload = (await request.json()) as Partial<RitualRecord>;
  const db = await getDb();
  const profiles = db.collection("profiles");
  const profile = await profiles.findOne({ userId: user.subject });

  const ritual = await createRitual({
    title: payload.title || "",
    content: payload.content || "",
    userId: user.subject,
    userName: profile?.fullName || user.subject,
  });

  return NextResponse.json(ritual, { status: 201 });
}
