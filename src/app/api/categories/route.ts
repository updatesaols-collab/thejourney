import { NextRequest, NextResponse } from "next/server";
import { createCategory, listCategories } from "@/lib/categories";
import { requireAdmin } from "@/lib/requestAuth";
import type { CategoryRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const limit = searchParams.get("limit");

  const categories = await listCategories({
    q,
    limit: limit ? Number(limit) : undefined,
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const payload = (await request.json()) as
    | Partial<CategoryRecord>
    | Partial<CategoryRecord>[];

  if (Array.isArray(payload)) {
    const results = [];
    for (const item of payload) {
      results.push(await createCategory(item));
    }
    return NextResponse.json(results, { status: 201 });
  }

  const created = await createCategory(payload);
  return NextResponse.json(created, { status: 201 });
}
