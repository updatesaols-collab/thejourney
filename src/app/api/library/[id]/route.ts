import { NextRequest, NextResponse } from "next/server";
import { deleteLibraryItem, getLibraryById, updateLibraryItem } from "@/lib/library";
import { requireAdmin } from "@/lib/requestAuth";
import type { LibraryRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const item = await getLibraryById(id);
  if (!item) {
    return NextResponse.json({ message: "Library item not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const payload = (await request.json()) as Partial<LibraryRecord>;
  const updated = await updateLibraryItem(id, payload);
  if (!updated) {
    return NextResponse.json({ message: "Library item not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(_request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const removed = await deleteLibraryItem(id);
  if (!removed) {
    return NextResponse.json({ message: "Library item not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
