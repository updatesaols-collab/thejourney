import { NextRequest, NextResponse } from "next/server";
import {
  deleteNotification,
  getNotificationById,
  updateNotification,
} from "@/lib/notifications";
import { requireAdmin } from "@/lib/requestAuth";
import type { NotificationRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const notification = await getNotificationById(id);
  if (!notification) {
    return NextResponse.json({ message: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json(notification);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const payload = (await request.json()) as Partial<NotificationRecord>;
  const updated = await updateNotification(id, payload);
  if (!updated) {
    return NextResponse.json({ message: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(_request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const removed = await deleteNotification(id);
  if (!removed) {
    return NextResponse.json({ message: "Notification not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
