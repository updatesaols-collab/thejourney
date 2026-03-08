import { NextRequest, NextResponse } from "next/server";
import { createProgram, listPrograms } from "@/lib/programs";
import type { ProgramRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const status = searchParams.get("status") || undefined;
  const limit = searchParams.get("limit");

  const programs = await listPrograms({
    q,
    tag,
    status,
    limit: limit ? Number(limit) : undefined,
  });

  return NextResponse.json(programs);
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Partial<ProgramRecord> | Partial<ProgramRecord>[];

  if (Array.isArray(payload)) {
    const results = [];
    for (const item of payload) {
      results.push(await createProgram(item));
    }
    return NextResponse.json(results, { status: 201 });
  }

  const program = await createProgram(payload);
  return NextResponse.json(program, { status: 201 });
}
