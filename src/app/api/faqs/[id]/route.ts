import { NextRequest, NextResponse } from "next/server";
import { deleteFaq, getFaqById, updateFaq } from "@/lib/faqs";
import { requireAdmin } from "@/lib/requestAuth";
import type { FaqRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const faq = await getFaqById(id);
  if (!faq) {
    return NextResponse.json({ message: "FAQ not found" }, { status: 404 });
  }
  return NextResponse.json(faq);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const payload = (await request.json()) as Partial<FaqRecord>;
  const updated = await updateFaq(id, payload);
  if (!updated) {
    return NextResponse.json({ message: "FAQ not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(_request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const removed = await deleteFaq(id);
  if (!removed) {
    return NextResponse.json({ message: "FAQ not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
