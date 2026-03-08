import { NextRequest, NextResponse } from "next/server";
import { deleteCategory, getCategoryById, updateCategory } from "@/lib/categories";
import type { CategoryRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const category = await getCategoryById(id);
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = (await request.json()) as Partial<CategoryRecord>;
  const updated = await updateCategory(id, payload);
  if (!updated) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const removed = await deleteCategory(id);
  if (!removed) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
