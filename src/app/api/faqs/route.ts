import { NextRequest, NextResponse } from "next/server";
import { createFaq, listFaqs } from "@/lib/faqs";
import { requireAdmin } from "@/lib/requestAuth";
import type { FaqRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") || undefined;
  const category = searchParams.get("category") || undefined;
  const limit = searchParams.get("limit");

  const faqs = await listFaqs({
    q,
    status,
    category,
    limit: limit ? Number(limit) : undefined,
  });

  return NextResponse.json(faqs);
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const payload = (await request.json()) as Partial<FaqRecord> | Partial<FaqRecord>[];

  if (Array.isArray(payload)) {
    const results = [];
    for (const item of payload) {
      results.push(await createFaq(item));
    }
    return NextResponse.json(results, { status: 201 });
  }

  const created = await createFaq(payload);
  return NextResponse.json(created, { status: 201 });
}
