import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Clock3,
  ExternalLink,
  MapPin,
  Sparkles,
  Timer,
  UserRound,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ModalErrorBoundary from "@/components/ModalErrorBoundary";
import TopBar from "@/components/TopBar";
import { notFound } from "next/navigation";
import { getProgramBySlug } from "@/lib/programs";
import { sanitizeRichHtml } from "@/lib/sanitizeHtml";
import ProgramRegistrationForm from "@/components/ProgramRegistrationForm";
import ProgramInvitationCard from "@/components/ProgramInvitationCard";
import { SEO_BRAND_NAME } from "@/lib/seo";

export const dynamic = "force-dynamic";

type ProgramPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProgramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) {
    return {
      title: "Program not found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${program.title} in Kathmandu`;
  const description =
    program.summary ||
    `Join ${program.title} by ${SEO_BRAND_NAME} for meditation, yoga and spiritual wellness in Kathmandu, Nepal.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/programs/${program.slug}`,
    },
    openGraph: {
      title: `${program.title} | ${SEO_BRAND_NAME}`,
      description,
      type: "article",
      url: `/programs/${program.slug}`,
      images: program.imageUrl
        ? [
            {
              url: program.imageUrl,
              alt: program.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${program.title} | Journey`,
      description,
      images: program.imageUrl ? [program.imageUrl] : ["/artofliving.png"],
    },
  };
}

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
              {program.date && (
                <div className="program-meta__item">
                  <CalendarDays size={16} />
                  <div>
                    <strong>Date</strong>
                    <span>{program.day ? `${program.day}, ${program.date}` : program.date}</span>
                  </div>
                </div>
              )}
              {program.time && (
                <div className="program-meta__item">
                  <Clock3 size={16} />
                  <div>
                    <strong>Time</strong>
                    <span>{program.time}</span>
                  </div>
                </div>
              )}
              {program.duration && (
                <div className="program-meta__item">
                  <Timer size={16} />
                  <div>
                    <strong>Duration</strong>
                    <span>{program.duration}</span>
                  </div>
                </div>
              )}
              {program.venue && (
                <div className="program-meta__item">
                  <Building2 size={16} />
                  <div>
                    <strong>Venue</strong>
                    <span>{program.venue}</span>
                  </div>
                </div>
              )}
              {program.location && (
                <div className="program-meta__item">
                  <MapPin size={16} />
                  <div>
                    <strong>Location</strong>
                    <span>{program.location}</span>
                  </div>
                </div>
              )}
              {program.facilitator && (
                <div className="program-meta__item">
                  <UserRound size={16} />
                  <div>
                    <strong>Teacher</strong>
                    <span>{program.facilitator}</span>
                  </div>
                </div>
              )}
              {program.mapUrl && (
                <div className="program-meta__item">
                  <ExternalLink size={16} />
                  <div>
                    <strong>Map</strong>
                    <span>
                      <a href={program.mapUrl} target="_blank" rel="noreferrer">
                        View map
                      </a>
                    </span>
                  </div>
                </div>
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
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(program.description) }}
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

          <ProgramInvitationCard
            programSlug={program.slug}
            programTitle={program.title}
          />
        </div>

        <BottomNav active="explore" />
      </main>

      <div className="modal" id="register-modal" aria-hidden="true">
        <div className="modal__backdrop" />
        <ModalErrorBoundary title="Registration form unavailable" resetKey={program.slug}>
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
        </ModalErrorBoundary>
      </div>
    </div>
  );
}
