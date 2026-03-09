import { NextRequest, NextResponse } from "next/server";
import { deleteRitual, getRitualById, updateRitual } from "@/lib/rituals";
import { requireAdmin, requireUser } from "@/lib/requestAuth";
import type { RitualRecord } from "@/lib/types";

type RitualRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RitualRouteContext) {
  const { id } = await context.params;
  const admin = requireAdmin(request);
  const user = requireUser(request);

  const ritual = await getRitualById(id);
  if (!ritual) {
    return NextResponse.json({ message: "Ritual not found." }, { status: 404 });
  }

  if (admin.ok) {
    return NextResponse.json(ritual);
  }
  if (!user.ok) {
    return user.response;
  }
  if (ritual.userId !== user.subject) {
    return NextResponse.json({ message: "Not allowed." }, { status: 403 });
  }

  return NextResponse.json(ritual);
}

export async function PATCH(request: NextRequest, context: RitualRouteContext) {
  const { id } = await context.params;
  const admin = requireAdmin(request);
  const user = requireUser(request);

  const existing = await getRitualById(id);
  if (!existing) {
    return NextResponse.json({ message: "Ritual not found." }, { status: 404 });
  }
  if (!admin.ok) {
    if (!user.ok) return user.response;
    if (existing.userId !== user.subject) {
      return NextResponse.json({ message: "Not allowed." }, { status: 403 });
    }
  }

  const payload = (await request.json()) as Partial<RitualRecord>;
  const updated = await updateRitual(id, {
    title: payload.title,
    content: payload.content,
    userName: payload.userName,
  });

  if (!updated) {
    return NextResponse.json({ message: "Unable to update ritual." }, { status: 500 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, context: RitualRouteContext) {
  const { id } = await context.params;
  const admin = requireAdmin(request);
  const user = requireUser(request);

  const existing = await getRitualById(id);
  if (!existing) {
    return NextResponse.json({ message: "Ritual not found." }, { status: 404 });
  }
  if (!admin.ok) {
    if (!user.ok) return user.response;
    if (existing.userId !== user.subject) {
      return NextResponse.json({ message: "Not allowed." }, { status: 403 });
    }
  }

  const deleted = await deleteRitual(id);
  if (!deleted) {
    return NextResponse.json({ message: "Unable to delete ritual." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
