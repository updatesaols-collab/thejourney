import Link from "next/link";
import { CalendarDays, ExternalLink, MapPin, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { notFound } from "next/navigation";
import { getProgramBySlug } from "@/lib/programs";
import ProgramRegistrationForm from "@/components/ProgramRegistrationForm";

export const dynamic = "force-dynamic";

type ProgramPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  return (
    <div className="page">
      <main className="phone">
        <div className="content">
          <TopBar title={program.title} showBack />

          <section className="program-hero surface">
            <div>
              <p className="eyebrow">Upcoming program</p>
              <h1>{program.title}</h1>
              <p className="program-summary">{program.summary}</p>
            </div>
            <div className="program-meta">
              <span>
                <CalendarDays size={16} />
                {program.day}, {program.time} · {program.duration}
              </span>
              {(program.location || program.venue) && (
                <span>
                  <MapPin size={16} />
                  {program.location || program.venue}
                </span>
              )}
              {program.mapUrl && (
                <span>
                  <ExternalLink size={16} />
                  <a href={program.mapUrl} target="_blank" rel="noreferrer">
                    View map
                  </a>
                </span>
              )}
            </div>
            <div className="hero__actions">
              <a className="button button--primary" href="#register-modal">
                Register now
              </a>
              <Link className="button button--ghost" href="/explore">
                View all programs
              </Link>
            </div>
          </section>

          <section className="program-section">
            <h2>What to expect</h2>
            {program.description && (
              <div
                className="richtext-display"
                dangerouslySetInnerHTML={{ __html: program.description }}
              />
            )}
          </section>

          <section className="program-section">
            <h2>Highlights</h2>
            <div className="highlight-grid">
              {program.highlights.map((item) => (
                <div key={item} className="highlight-card surface">
                  <Sparkles size={16} />
                  <p>{item}</p>
                </div>
              ))}
            </div>
            <a className="button button--primary" href="#register-modal">
              Register now
            </a>
          </section>

          <section className="program-section" id="register">
            <div className="register-card surface">
              <div>
                <h2>Reserve your spot</h2>
                <p>
                  Join the live circle and receive reminders with all the session
                  details.
                </p>
              </div>
              <a className="button button--primary" href="#register-modal">
                Register now
              </a>
            </div>
          </section>

          <section className="cta-panel surface">
            <div>
              <h2>Invite a friend</h2>
              <p>Share the calm. Bring someone with you to this session.</p>
            </div>
            <a className="button button--secondary" href="#register-modal">
              Register now
            </a>
          </section>
        </div>

        <BottomNav active="explore" />
      </main>

      <div className="modal" id="register-modal" aria-hidden="true">
        <div className="modal__backdrop" />
        <div className="modal__content surface">
          <div className="modal__header">
            <div>
              <p className="eyebrow">Register now</p>
              <h2>{program.title}</h2>
            </div>
            <a className="modal__close" href="#" aria-label="Close form">
              Close
            </a>
          </div>
          <ProgramRegistrationForm program={program} />
        </div>
      </div>
    </div>
  );
}
