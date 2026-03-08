import { Collection, ObjectId } from "mongodb";
import { BLOGS } from "@/data/blogs";
import { getDb } from "@/lib/mongodb";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import { slugify } from "@/lib/slug";
import type { BlogRecord, BlogStatus } from "@/lib/types";

type BlogDocument = {
  _id?: ObjectId;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  featured: boolean;
  status: BlogStatus;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION_NAME = "blogs";

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const normalizeTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .map((item) => item.toLowerCase());
  }
  if (typeof value === "string") {
    return value
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.toLowerCase());
  }
  return [];
};

const normalizeBlog = (doc: BlogDocument & { _id: { toString(): string } }): BlogRecord => ({
  id: doc._id.toString(),
  slug: doc.slug,
  title: doc.title || "",
  excerpt: doc.excerpt || "",
  content: sanitizeRichHtml(doc.content || ""),
  coverImage: doc.coverImage || "",
  author: doc.author || "Journey Editorial Team",
  tags: normalizeTags(doc.tags),
  seoTitle: doc.seoTitle || "",
  seoDescription: doc.seoDescription || "",
  featured: Boolean(doc.featured),
  status: doc.status || "Draft",
  publishedAt: doc.publishedAt?.toISOString(),
  createdAt: doc.createdAt?.toISOString(),
  updatedAt: doc.updatedAt?.toISOString(),
});

const seedBlogs = (): BlogDocument[] => {
  const now = new Date();
  return BLOGS.map((item) => ({
    ...item,
    slug: slugify(item.slug || item.title || "blog-post"),
    excerpt: item.excerpt || "",
    content: sanitizeRichHtml(item.content || ""),
    coverImage: item.coverImage || "",
    author: item.author || "Journey Editorial Team",
    tags: normalizeTags(item.tags),
    seoTitle: item.seoTitle || "",
    seoDescription: item.seoDescription || "",
    featured: Boolean(item.featured),
    status: item.status || "Draft",
    publishedAt: parseDate(item.publishedAt) || now,
    createdAt: now,
    updatedAt: now,
  }));
};

const getBlogsCollection = async (): Promise<Collection<BlogDocument>> => {
  const db = await getDb();
  return db.collection<BlogDocument>(COLLECTION_NAME);
};

export const ensureBlogsSeeded = async () => {
  const collection = await getBlogsCollection();
  const count = await collection.countDocuments();
  if (count > 0) return;
  await collection.insertMany(seedBlogs());
};

export const listBlogs = async (filters?: {
  q?: string;
  status?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
}) => {
  await ensureBlogsSeeded();
  const collection = await getBlogsCollection();
  const query: Record<string, unknown> = {};
  if (filters?.q) {
    query.$or = [
      { title: { $regex: filters.q, $options: "i" } },
      { excerpt: { $regex: filters.q, $options: "i" } },
      { content: { $regex: filters.q, $options: "i" } },
      { tags: { $regex: filters.q, $options: "i" } },
      { seoTitle: { $regex: filters.q, $options: "i" } },
    ];
  }
  if (filters?.status && filters.status !== "All") {
    query.status = filters.status;
  }
  if (filters?.tag && filters.tag !== "All") {
    query.tags = { $in: [filters.tag.toLowerCase()] };
  }
  if (typeof filters?.featured === "boolean") {
    query.featured = filters.featured;
  }

  let cursor = collection
    .find(query)
    .sort({ featured: -1, publishedAt: -1, updatedAt: -1, _id: -1 });
  if (filters?.limit) {
    cursor = cursor.limit(filters.limit);
  }
  const docs = await cursor.toArray();
  return docs.map((doc) => normalizeBlog(doc as BlogDocument & { _id: { toString(): string } }));
};

export const getBlogById = async (id: string) => {
  await ensureBlogsSeeded();
  if (!ObjectId.isValid(id)) return null;
  const collection = await getBlogsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc || !doc._id) return null;
  return normalizeBlog(doc as BlogDocument & { _id: { toString(): string } });
};

export const getBlogBySlug = async (slug: string) => {
  await ensureBlogsSeeded();
  const collection = await getBlogsCollection();
  const doc = await collection.findOne({ slug });
  if (!doc || !doc._id) return null;
  return normalizeBlog(doc as BlogDocument & { _id: { toString(): string } });
};

export const createBlog = async (payload: Partial<BlogRecord>) => {
  const collection = await getBlogsCollection();
  const now = new Date();
  const slugBase = slugify(payload.slug?.trim() || payload.title || "blog-post");
  let slug = slugBase;
  const existing = await collection.findOne({ slug });
  if (existing) {
    slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const doc: BlogDocument = {
    slug,
    title: payload.title?.trim() || "Untitled blog post",
    excerpt: payload.excerpt?.trim() || "",
    content: sanitizeRichHtml(payload.content || ""),
    coverImage: payload.coverImage?.trim() || "",
    author: payload.author?.trim() || "Journey Editorial Team",
    tags: normalizeTags(payload.tags),
    seoTitle: payload.seoTitle?.trim() || "",
    seoDescription: payload.seoDescription?.trim() || "",
    featured: Boolean(payload.featured),
    status: (payload.status as BlogStatus) || "Draft",
    publishedAt: parseDate(payload.publishedAt) || now,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(doc);
  return normalizeBlog({ ...doc, _id: result.insertedId } as BlogDocument & {
    _id: { toString(): string };
  });
};

export const updateBlog = async (id: string, payload: Partial<BlogRecord>) => {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getBlogsCollection();
  const existing = await collection.findOne({ _id: new ObjectId(id) });
  if (!existing) return null;
  const updates: Partial<BlogDocument> = {
    updatedAt: new Date(),
  };

  if (payload.title !== undefined) updates.title = payload.title.trim();
  if (payload.excerpt !== undefined) updates.excerpt = payload.excerpt.trim();
  if (payload.content !== undefined) updates.content = sanitizeRichHtml(payload.content);
  if (payload.coverImage !== undefined) updates.coverImage = payload.coverImage.trim();
  if (payload.author !== undefined) updates.author = payload.author.trim();
  if (payload.tags !== undefined) updates.tags = normalizeTags(payload.tags);
  if (payload.seoTitle !== undefined) updates.seoTitle = payload.seoTitle.trim();
  if (payload.seoDescription !== undefined) {
    updates.seoDescription = payload.seoDescription.trim();
  }
  if (payload.featured !== undefined) updates.featured = Boolean(payload.featured);
  if (payload.status !== undefined) updates.status = payload.status as BlogStatus;
  if (payload.publishedAt !== undefined) {
    updates.publishedAt = parseDate(payload.publishedAt);
  }

  const requestedSlugSource =
    payload.slug !== undefined ? payload.slug : payload.title !== undefined ? payload.title : "";
  if (requestedSlugSource) {
    const requestedSlug = slugify(requestedSlugSource) || "blog-post";
    if (requestedSlug !== existing.slug) {
      let candidate = requestedSlug;
      let index = 1;
      while (await collection.findOne({ slug: candidate, _id: { $ne: existing._id } })) {
        index += 1;
        candidate = `${requestedSlug}-${index}`;
      }
      updates.slug = candidate;
    }
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );

  if (!result || !result._id) return null;
  return normalizeBlog(result as BlogDocument & { _id: { toString(): string } });
};

export const deleteBlog = async (id: string) => {
  if (!ObjectId.isValid(id)) return false;
  const collection = await getBlogsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
};
