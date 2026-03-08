import { NextRequest, NextResponse } from "next/server";
import { createReview, listReviews } from "@/lib/reviews";
import { requireAdmin } from "@/lib/requestAuth";
import type { ReviewRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") || undefined;
  const rating = searchParams.get("rating");
  const featured = searchParams.get("featured");
  const limit = searchParams.get("limit");

  const reviews = await listReviews({
    q,
    status,
    rating: rating ? Number(rating) : undefined,
    featured:
      featured === "true" ? true : featured === "false" ? false : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return NextResponse.json(reviews);
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const payload = (await request.json()) as Partial<ReviewRecord> | Partial<ReviewRecord>[];

  if (Array.isArray(payload)) {
    const results = [];
    for (const item of payload) {
      results.push(await createReview(item));
    }
    return NextResponse.json(results, { status: 201 });
  }

  const created = await createReview(payload);
  return NextResponse.json(created, { status: 201 });
}
