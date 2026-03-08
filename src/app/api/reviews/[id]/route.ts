import { NextRequest, NextResponse } from "next/server";
import { deleteReview, getReviewById, updateReview } from "@/lib/reviews";
import { requireAdmin } from "@/lib/requestAuth";
import type { ReviewRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const review = await getReviewById(id);
  if (!review) {
    return NextResponse.json({ message: "Review not found" }, { status: 404 });
  }
  return NextResponse.json(review);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const payload = (await request.json()) as Partial<ReviewRecord>;
  const updated = await updateReview(id, payload);
  if (!updated) {
    return NextResponse.json({ message: "Review not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(_request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const removed = await deleteReview(id);
  if (!removed) {
    return NextResponse.json({ message: "Review not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
