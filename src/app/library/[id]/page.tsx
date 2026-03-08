import { notFound } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { getLibraryById } from "@/lib/library";

export const dynamic = "force-dynamic";

type LibraryDetailProps = {
  params: Promise<{ id: string }>;
};

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
            <h1>{item.title}</h1>
            <div className="library-detail__meta">
              {item.time && <span>{item.time}</span>}
              {item.tone && <span>{item.tone}</span>}
            </div>
            {item.description ? (
              <div
                className="richtext-display library-detail__body"
                dangerouslySetInnerHTML={{ __html: item.description }}
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
