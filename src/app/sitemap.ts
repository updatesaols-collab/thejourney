import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/explore", changeFrequency: "daily", priority: 0.9 },
  { path: "/library", changeFrequency: "weekly", priority: 0.85 },
  { path: "/rituals", changeFrequency: "weekly", priority: 0.6 },
];

const parseDate = (value?: string) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [{ listPrograms }, { listLibrary }, { listBlogs }] = await Promise.all([
      import("@/lib/programs"),
      import("@/lib/library"),
      import("@/lib/blogs"),
    ]);
    const [programs, libraryItems, blogs] = await Promise.all([
      listPrograms(),
      listLibrary(),
      listBlogs({ status: "Published" }),
    ]);

    for (const program of programs) {
      if (!program.slug || program.status === "Closed") continue;
      entries.push({
        url: absoluteUrl(`/programs/${program.slug}`),
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const item of libraryItems) {
      if (!item.id || !item.title) continue;
      if (item.kind === "hero" || item.kind === "cta") continue;
      entries.push({
        url: absoluteUrl(`/library/${item.id}`),
        lastModified: parseDate(item.updatedAt || item.createdAt),
        changeFrequency: "monthly",
        priority: 0.65,
      });
    }

    for (const blog of blogs) {
      if (!blog.slug || blog.status !== "Published") continue;
      entries.push({
        url: absoluteUrl(`/library/article/${blog.slug}`),
        lastModified: parseDate(blog.updatedAt || blog.publishedAt || blog.createdAt),
        changeFrequency: "monthly",
        priority: blog.featured ? 0.8 : 0.7,
      });
    }
  } catch {
    // Keep static routes available even if content services are unavailable.
  }

  return entries;
}
