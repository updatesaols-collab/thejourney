import { NextRequest, NextResponse } from "next/server";
import { createHeroSlide, listHeroSlides } from "@/lib/heroSlides";
import type { HeroSlideRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const limit = searchParams.get("limit");

  const slides = await listHeroSlides({
    status,
    limit: limit ? Number(limit) : undefined,
  });

  return NextResponse.json(slides);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as
    | Partial<HeroSlideRecord>
    | Partial<HeroSlideRecord>[];

  if (Array.isArray(payload)) {
    const results = [];
    for (const item of payload) {
      results.push(await createHeroSlide(item));
    }
    return NextResponse.json(results, { status: 201 });
  }

  const created = await createHeroSlide(payload);
  return NextResponse.json(created, { status: 201 });
}
