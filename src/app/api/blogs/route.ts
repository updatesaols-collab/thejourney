import { NextRequest, NextResponse } from "next/server";
import { createBlog, listBlogs } from "@/lib/blogs";
import { requireAdmin } from "@/lib/requestAuth";
import type { BlogRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const status = searchParams.get("status") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const featured = searchParams.get("featured");
  const limit = searchParams.get("limit");

  const blogs = await listBlogs({
    q,
    status,
    tag,
    featured:
      featured === "true" ? true : featured === "false" ? false : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  return NextResponse.json(blogs);
}

export async function POST(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin.ok) return admin.response;

  const payload = (await request.json()) as Partial<BlogRecord> | Partial<BlogRecord>[];

  if (Array.isArray(payload)) {
    const results = [];
    for (const item of payload) {
      results.push(await createBlog(item));
    }
    return NextResponse.json(results, { status: 201 });
  }

  const created = await createBlog(payload);
  return NextResponse.json(created, { status: 201 });
}
