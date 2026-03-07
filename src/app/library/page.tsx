import { ArrowUpRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

const SUGGESTIONS = [
  {
    title: "Sleep",
    description: "Fall asleep with ease",
    tone: "sleep",
  },
  {
    title: "Anxiety",
    description: "Calm stress and anxious spirals",
    tone: "anxiety",
  },
  {
    title: "Morning energy",
    description: "Wake up with focus and energy",
    tone: "morning",
  },
  {
    title: "Pain relief",
    description: "Soothe tension in the body",
    tone: "relief",
  },
];

const FEATURES = [
  {
    tag: "Breathwork",
    title: "A beginner’s path to steady breath",
    description: "A practical guide to calmer breathing in under five minutes.",
    time: "6 min read",
  },
  {
    tag: "Mindset",
    title: "Resetting the inner dialogue",
    description: "Prompts to soften self-talk and restore perspective.",
    time: "8 min read",
  },
  {
    tag: "Routine",
    title: "Evening ritual for deeper sleep",
    description: "A gentle 3-step ritual to transition into rest.",
    time: "5 min read",
  },
];

const QUICK_READS = [
  { title: "Two-minute grounding check-in", time: "2 min" },
  { title: "Breath cues for anxious moments", time: "3 min" },
  { title: "Desk stretch reset", time: "4 min" },
];

export default function LibraryPage() {
  return (
    <div className="page">
      <main className="phone">
        <TopBar title="Library" showBack />
        <div className="content">
          <section className="library-hero surface">
            <div>
              <span className="eyebrow">Daily guidance</span>
              <h1>Library of calm</h1>
              <p>
                Short reads, soothing practices, and guided reflections to help you
                feel supported every day.
              </p>
            </div>
            <button className="button button--primary">Start with basics</button>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Suggestions</h2>
              <span className="library-meta">Curated for you</span>
            </div>
            <div className="library-list">
              {SUGGESTIONS.map((item) => (
                <article
                  key={item.title}
                  className={`library-card surface library-card--${item.tone}`}
                >
                  <div className="library-card__text">
                    <p className="library-card__title">{item.title}</p>
                    <p className="library-card__meta">{item.description}</p>
                  </div>
                  <div className="library-card__art" aria-hidden="true" />
                </article>
              ))}
            </div>
          </section>

          <section className="library-cta surface">
            <div>
              <h3>Unlock the full library</h3>
              <p>Save favorites, download guides, and get weekly reflections.</p>
            </div>
            <button className="button button--secondary">Subscribe</button>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>New reads</h2>
              <span className="library-meta">Fresh this week</span>
            </div>
            <div className="library-articles">
              {FEATURES.map((item) => (
                <article key={item.title} className="library-article surface">
                  <span className="library-article__tag">{item.tag}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="library-article__footer">
                    <span>{item.time}</span>
                    <button className="mini-button" type="button">
                      Read
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Quick practices</h2>
              <span className="library-meta">5 minutes or less</span>
            </div>
            <div className="library-quick">
              {QUICK_READS.map((item) => (
                <div key={item.title} className="library-quick-item surface">
                  <div>
                    <p className="library-quick-item__title">{item.title}</p>
                    <span className="library-quick-item__meta">{item.time}</span>
                  </div>
                  <button className="mini-button" type="button">
                    Open
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
        <BottomNav active="library" />
      </main>
    </div>
  );
}
