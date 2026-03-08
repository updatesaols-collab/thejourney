import { NextRequest, NextResponse } from "next/server";
import { createLibraryItem, listLibrary } from "@/lib/library";
import type { LibraryRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || undefined;
  const q = searchParams.get("q") || undefined;

  const items = await listLibrary({ kind, q });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<LibraryRecord> | Partial<LibraryRecord>[];

  if (Array.isArray(payload)) {
    const results = [];
    for (const item of payload) {
      results.push(await createLibraryItem(item));
    }
    return NextResponse.json(results, { status: 201 });
  }

  const created = await createLibraryItem(payload);
  return NextResponse.json(created, { status: 201 });
}
