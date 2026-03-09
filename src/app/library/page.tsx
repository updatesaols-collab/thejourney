import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { listBlogs } from "@/lib/blogs";
import { listLibrary } from "@/lib/library";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import type { LibraryRecord, LibraryTone } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Library for Meditation and Wellness",
  description:
    "Read guidance and articles on meditation, breathwork, stress relief, sleep and spiritual wellbeing from Journey - The Art of Living Nepal.",
  alternates: {
    canonical: "/library",
  },
};

const TONE_OPTIONS = new Set<LibraryTone>(["sleep", "anxiety", "morning", "relief"]);

const LIBRARY_CARD_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const sortByOrder = (items: LibraryRecord[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const toMarkup = (value: string) => ({ __html: sanitizeRichHtml(value) });

const toPlainTextPreview = (value?: string) =>
  (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Normalizes date output for article chips/cards in the UI.
 */
const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return LIBRARY_CARD_DATE_FORMATTER.format(date);
};

type LibraryPageProps = {
  searchParams: Promise<{ q?: string }>;
};

/**
 * Library landing page.
 * Shows authored library blocks plus merged legacy article content in one place.
 */
export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const [items, blogs] = await Promise.all([
    listLibrary({ q: query || undefined }),
    listBlogs({ status: "Published", q: query || undefined }),
  ]);
  const hero = items.find((item) => item.kind === "hero");
  const suggestions = sortByOrder(items.filter((item) => item.kind === "suggestion"));
  const articles = sortByOrder(items.filter((item) => item.kind === "article"));
  const quickReads = sortByOrder(items.filter((item) => item.kind === "quick"));
  const featuredBlogs = blogs.filter((item) => item.featured).slice(0, 3);
  const standardBlogs = blogs.filter((item) => !item.featured).slice(0, 6);

  return (
    <div className="page">
      <main className="phone">
        <div className="content">
          <TopBar title="Library" showBack />

          {hero && (
            <section className="library-hero surface">
              <div>
                {hero.eyebrow && <span className="eyebrow">{hero.eyebrow}</span>}
                <h1>{hero.title}</h1>
                {hero.description && (
                  <div
                    className="richtext-display"
                    dangerouslySetInnerHTML={toMarkup(hero.description)}
                  />
                )}
              </div>
              {hero.buttonLabel && (
                <button className="button button--primary">{hero.buttonLabel}</button>
              )}
            </section>
          )}

          <section className="library-search-wrap">
            <form className="home-search library-search surface" action="/library" method="get">
              <Search size={18} />
              <input
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search library"
                aria-label="Search library"
              />
              {query ? (
                <Link href="/library" className="library-search__clear">
                  Clear
                </Link>
              ) : null}
            </form>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Suggestions</h2>
              <span className="library-meta">Curated for you</span>
            </div>
            <div className="library-list">
              {suggestions.length ? (
                suggestions.map((item) => {
                  const tone = TONE_OPTIONS.has(item.tone ?? "sleep")
                    ? (item.tone as LibraryTone)
                    : "sleep";
                  return (
                    <Link
                      key={item.id}
                      href={`/library/${item.id}`}
                      className={`library-card surface library-card--${tone}`}
                    >
                      <div className="library-card__text">
                        {item.eyebrow && (
                          <span className="library-card__eyebrow">{item.eyebrow}</span>
                        )}
                        <p className="library-card__title">{item.title}</p>
                        {item.description && (
                          <p className="library-card__meta">
                            {toPlainTextPreview(item.description)}
                          </p>
                        )}
                      </div>
                      <div className="library-card__art" aria-hidden="true" />
                    </Link>
                  );
                })
              ) : (
                <p className="library-meta">No suggestions yet.</p>
              )}
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Articles</h2>
              <span className="library-meta">Fresh guidance</span>
            </div>
            <div className="library-articles">
              {articles.length ? (
                articles.map((item) => (
                  <Link
                    key={item.id}
                    href={`/library/${item.id}`}
                    className="library-article surface"
                  >
                    {item.eyebrow && (
                      <span className="library-article__eyebrow">{item.eyebrow}</span>
                    )}
                    {item.tag && (
                      <span className="library-article__tag">{item.tag}</span>
                    )}
                    {item.imageUrl ? (
                      <img
                        className="library-article__cover"
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                      />
                    ) : null}
                    <div>
                      <h3>{item.title}</h3>
                      {item.description && (
                        <div
                          className="library-article__description richtext-display"
                          dangerouslySetInnerHTML={toMarkup(item.description)}
                        />
                      )}
                    </div>
                    <div className="library-article__footer">
                      <span>{item.time}</span>
                      <span className="mini-button">
                        {item.buttonLabel || "Read"}
                        <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))
              ) : null}
            </div>
            {!!featuredBlogs.length && (
              <div className="blog-grid">
                {featuredBlogs.map((item) => (
                  <Link
                    key={item.id}
                    href={`/library/article/${item.slug}`}
                    className="surface blog-card"
                  >
                    {item.coverImage ? (
                      <img
                        className="blog-card__cover"
                        src={item.coverImage}
                        alt={item.title}
                        loading="lazy"
                      />
                    ) : null}
                    <div className="blog-card__content">
                      <div className="blog-card__meta">
                        {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
                        {item.author && <span>By {item.author}</span>}
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.excerpt}</p>
                      <div className="blog-card__tags">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={`${item.id}-${tag}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {!!standardBlogs.length && (
              <div className="blog-list">
                {standardBlogs.map((item) => (
                  <Link
                    key={item.id}
                    href={`/library/article/${item.slug}`}
                    className="surface blog-list__item"
                  >
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.excerpt}</p>
                      <div className="blog-card__meta">
                        {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
                        {item.tags[0] && <span>{item.tags[0]}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {!articles.length && !featuredBlogs.length && !standardBlogs.length && (
              <p className="library-meta">No articles yet.</p>
            )}
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Quick practices</h2>
              <span className="library-meta">5 minutes or less</span>
            </div>
            <div className="library-quick">
              {quickReads.length ? (
                quickReads.map((item) => (
                  <Link
                    key={item.id}
                    href={`/library/${item.id}`}
                    className="library-quick-item surface"
                  >
                    <div>
                      <p className="library-quick-item__title">{item.title}</p>
                      <span className="library-quick-item__meta">{item.time}</span>
                    </div>
                    <span className="mini-button">{item.buttonLabel || "Open"}</span>
                  </Link>
                ))
              ) : (
                <p className="library-meta">No quick practices yet.</p>
              )}
            </div>
          </section>
        </div>
        <BottomNav active="library" />
      </main>
    </div>
  );
}
