import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, Facebook, Linkedin, Mail, MapPin, MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { getLibraryById } from "@/lib/library";
import { listPrograms } from "@/lib/programs";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import { absoluteUrl } from "@/lib/seo";

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

  const upcomingPrograms = (await listPrograms({ status: "Open", limit: 3 })).slice(0, 3);
  const articleUrl = absoluteUrl(`/library/${item.id}`);
  const shareTitle = item.title;
  const shareText =
    item.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || item.title;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${articleUrl}`)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${articleUrl}`)}`;

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

            <section className="blog-detail__share">
              <div>
                <p className="blog-detail__share-label">Share this article</p>
                <p className="blog-detail__share-copy">
                  Send it to someone who would benefit from it.
                </p>
              </div>
              <div className="blog-detail__share-actions">
                <a
                  className="blog-detail__share-link"
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
                <a
                  className="blog-detail__share-link"
                  href={facebookHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Facebook size={16} />
                  Facebook
                </a>
                <a
                  className="blog-detail__share-link"
                  href={linkedinHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Linkedin size={16} />
                  LinkedIn
                </a>
                <a className="blog-detail__share-link" href={emailHref}>
                  <Mail size={16} />
                  Email
                </a>
              </div>
            </section>
          </section>

          {upcomingPrograms.length > 0 && (
            <section className="section">
              <div className="section__head">
                <h2>Upcoming programs</h2>
                <span className="library-meta">Join a live session next</span>
              </div>
              <div className="program-list">
                {upcomingPrograms.map((program) => (
                  <article key={program.id} className="program-card surface">
                    <div className="program-card__content">
                      <div className="program-card__media">
                        {program.imageUrl ? (
                          <img src={program.imageUrl} alt={program.title} loading="lazy" />
                        ) : (
                          <div className="program-card__media-placeholder" />
                        )}
                      </div>
                      <div className="program-card__main">
                        <p className="program-card__title">{program.title}</p>
                        <div className="program-card__meta">
                          <span>
                            <CalendarDays size={14} />
                            {program.date} · {program.time}
                          </span>
                          <span>
                            <MapPin size={14} />
                            {program.location || program.venue}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="program-card__aside">
                      <span className="tag">{program.tag}</span>
                      <span className="duration">{program.duration}</span>
                      <Link className="mini-button" href={`/programs/${program.slug}`}>
                        View program
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
        <BottomNav active="library" />
      </main>
    </div>
  );
}
