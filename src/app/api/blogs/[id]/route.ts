import { NextRequest, NextResponse } from "next/server";
import { deleteBlog, getBlogById, updateBlog } from "@/lib/blogs";
import { requireAdmin } from "@/lib/requestAuth";
import type { BlogRecord } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const blog = await getBlogById(id);
  if (!blog) {
    return NextResponse.json({ message: "Blog not found" }, { status: 404 });
  }
  return NextResponse.json(blog);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const payload = (await request.json()) as Partial<BlogRecord>;
  const updated = await updateBlog(id, payload);
  if (!updated) {
    return NextResponse.json({ message: "Blog not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const admin = requireAdmin(_request);
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  const removed = await deleteBlog(id);
  if (!removed) {
    return NextResponse.json({ message: "Blog not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
