import { NextRequest, NextResponse } from "next/server";
import { deleteProgram, getProgramBySlug, updateProgram } from "@/lib/programs";
import type { ProgramRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const program = await getProgramBySlug(slug);
  if (!program) {
    return NextResponse.json({ message: "Program not found" }, { status: 404 });
  }
  return NextResponse.json(program);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const payload = (await request.json()) as Partial<ProgramRecord>;
  const updated = await updateProgram(slug, payload);
  if (!updated) {
    return NextResponse.json({ message: "Program not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const removed = await deleteProgram(slug);
  if (!removed) {
    return NextResponse.json({ message: "Program not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
