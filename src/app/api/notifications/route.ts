import { NextRequest, NextResponse } from "next/server";
import { createNotification, listNotifications } from "@/lib/notifications";
import { requireAdmin } from "@/lib/requestAuth";
import type { NotificationRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") || undefined;
  const limit = searchParams.get("limit");

  const notifications = await listNotifications({
    q,
    status,
    limit: limit ? Number(limit) : undefined,
  });

  return NextResponse.json(notifications);
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const payload = (await request.json()) as
    | Partial<NotificationRecord>
    | Partial<NotificationRecord>[];

  if (Array.isArray(payload)) {
    const results = [];
    for (const item of payload) {
      results.push(await createNotification(item));
    }
    return NextResponse.json(results, { status: 201 });
  }

  const created = await createNotification(payload);
  return NextResponse.json(created, { status: 201 });
}
