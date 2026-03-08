import { NextRequest, NextResponse } from "next/server";
import { deleteHeroSlide, getHeroSlideById, updateHeroSlide } from "@/lib/heroSlides";
import type { HeroSlideRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const slide = await getHeroSlideById(id);
  if (!slide) {
    return NextResponse.json({ message: "Hero slide not found" }, { status: 404 });
  }
  return NextResponse.json(slide);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = (await request.json()) as Partial<HeroSlideRecord>;
  const updated = await updateHeroSlide(id, payload);
  if (!updated) {
    return NextResponse.json({ message: "Hero slide not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const removed = await deleteHeroSlide(id);
  if (!removed) {
    return NextResponse.json({ message: "Hero slide not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
