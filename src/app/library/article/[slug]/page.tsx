import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { getBlogBySlug, listBlogs } from "@/lib/blogs";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import { absoluteUrl, SEO_BRAND_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

type LibraryArticleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
          </article>

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
