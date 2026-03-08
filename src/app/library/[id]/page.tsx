import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { getLibraryById } from "@/lib/library";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";

export const dynamic = "force-dynamic";

type LibraryDetailProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: LibraryDetailProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getLibraryById(id);
  if (!item) {
    return {
      title: "Library",
      robots: { index: false, follow: false },
    };
  }

  const description =
    item.description
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160) ||
    "Guided reading and practical insights from Journey - The Art of Living Nepal.";

  return {
    title: item.title,
    description,
    alternates: {
      canonical: `/library/${item.id}`,
    },
    openGraph: {
      title: `${item.title} | Journey Library`,
      description,
      url: `/library/${item.id}`,
      type: "article",
      images: item.imageUrl
        ? [
            {
              url: item.imageUrl,
              alt: item.title,
            },
          ]
        : undefined,
    },
  };
}

export default async function LibraryDetailPage({ params }: LibraryDetailProps) {
  const { id } = await params;
  const item = await getLibraryById(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="page">
      <main className="phone">
        <div className="content">
          <TopBar title="Library" showBack />

          <section className="library-detail surface">
            {item.tag && <span className="library-article__tag">{item.tag}</span>}
            {item.imageUrl ? (
              <img
                className="library-detail__cover"
                src={item.imageUrl}
                alt={item.title}
              />
            ) : null}
            <h1>{item.title}</h1>
            <div className="library-detail__meta">
              {item.time && <span>{item.time}</span>}
              {item.tone && <span>{item.tone}</span>}
            </div>
            {item.description ? (
              <div
                className="richtext-display library-detail__body"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(item.description) }}
              />
            ) : (
              <p className="library-meta">No content yet.</p>
            )}
          </section>
        </div>
        <BottomNav active="library" />
      </main>
    </div>
  );
}
