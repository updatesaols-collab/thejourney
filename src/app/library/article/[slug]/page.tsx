import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, Facebook, Linkedin, Mail, MapPin, MessageCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { getBlogBySlug, listBlogs } from "@/lib/blogs";
import { listPrograms } from "@/lib/programs";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import { absoluteUrl, SEO_BRAND_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

const LIBRARY_ARTICLE_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

type LibraryArticleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return LIBRARY_ARTICLE_DATE_FORMATTER.format(date);
};

export async function generateMetadata({
  params,
}: LibraryArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBlogBySlug(slug);

  if (!article || article.status !== "Published") {
    return {
      title: "Library",
      robots: { index: false, follow: false },
    };
  }

  const title = article.seoTitle?.trim() || article.title;
  const description = article.seoDescription?.trim() || article.excerpt;

  return {
    title,
    description,
    keywords: article.tags,
    alternates: {
      canonical: `/library/article/${article.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/library/article/${article.slug}`,
      publishedTime: article.publishedAt,
      authors: [article.author],
      tags: article.tags,
      images: article.coverImage
        ? [
            {
              url: article.coverImage,
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.coverImage ? [article.coverImage] : ["/artofliving.png"],
    },
  };
}

export default async function LibraryArticleDetailPage({
  params,
}: LibraryArticleDetailPageProps) {
  const { slug } = await params;
  const article = await getBlogBySlug(slug);

  if (!article || article.status !== "Published") {
    notFound();
  }

  const related = (await listBlogs({ status: "Published", limit: 6 }))
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);
  const upcomingPrograms = (await listPrograms({ status: "Open", limit: 3 })).slice(0, 3);
  const articleUrl = absoluteUrl(`/library/article/${article.slug}`);
  const shareTitle = article.title;
  const shareText = article.excerpt || article.seoDescription || article.title;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${articleUrl}`)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`;
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`;
  const emailHref = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${articleUrl}`)}`;

  const articleStructuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.seoDescription?.trim() || article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Organization",
      name: article.author || SEO_BRAND_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SEO_BRAND_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/artofliving.png"),
      },
    },
    image: article.coverImage || absoluteUrl("/artofliving.png"),
    mainEntityOfPage: absoluteUrl(`/library/article/${article.slug}`),
    articleSection: article.tags,
  });

  return (
    <div className="page">
      <main className="phone">
        <div className="content">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: articleStructuredData }}
          />
          <TopBar title="Library" showBack />

          <article className="surface blog-detail">
            {article.coverImage ? (
              <img className="blog-detail__cover" src={article.coverImage} alt={article.title} />
            ) : null}

            <div className="blog-detail__head">
              <div className="blog-card__meta">
                {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
                {article.author && <span>By {article.author}</span>}
              </div>
              <h1>{article.title}</h1>
              {!!article.tags.length && (
                <div className="blog-card__tags">
                  {article.tags.map((tag) => (
                    <span key={`${article.id}-${tag}`}>{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div
              className="richtext-display blog-detail__body"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(article.content) }}
            />

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
          </article>

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

          {related.length > 0 && (
            <section className="section">
              <div className="section__head">
                <h2>Related articles</h2>
              </div>
              <div className="blog-list">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/library/article/${item.slug}`}
                    className="surface blog-list__item"
                  >
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.excerpt}</p>
                    </div>
                  </Link>
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
