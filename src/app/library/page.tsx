import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { listLibrary } from "@/lib/library";
import type { LibraryRecord, LibraryTone } from "@/lib/types";

export const dynamic = "force-dynamic";

const TONE_OPTIONS = new Set<LibraryTone>(["sleep", "anxiety", "morning", "relief"]);

const sortByOrder = (items: LibraryRecord[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const toMarkup = (value: string) => ({ __html: value });

export default async function LibraryPage() {
  const items = await listLibrary();
  const hero = items.find((item) => item.kind === "hero");
  const suggestions = sortByOrder(items.filter((item) => item.kind === "suggestion"));
  const articles = sortByOrder(items.filter((item) => item.kind === "article"));
  const quickReads = sortByOrder(items.filter((item) => item.kind === "quick"));

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
                          <div
                            className="library-card__meta richtext-display"
                            dangerouslySetInnerHTML={toMarkup(item.description)}
                          />
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
              <h2>New reads</h2>
              <span className="library-meta">Fresh this week</span>
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
              ) : (
                <p className="library-meta">No reads yet.</p>
              )}
            </div>
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
