"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Heart,
  Leaf,
  PlayCircle,
  Sparkles,
  Wind,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import type { ProgramRecord } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/clientUser";

export default function Home() {
  const [greeting, setGreeting] = useState("Welcome");
  const [displayName, setDisplayName] = useState("Seeker");
  const [journalType, setJournalType] = useState<"journal" | "experience">(
    "journal"
  );
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [journalEntry, setJournalEntry] = useState("");
  const [experienceProgram, setExperienceProgram] = useState("");
  const [experienceRating, setExperienceRating] = useState("");
  const [experienceMessage, setExperienceMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const programIcon = (tag: string) => {
    switch (tag) {
      case "Breathwork":
        return Wind;
      case "Yoga":
        return Heart;
      case "Meditation":
        return Sparkles;
      case "Sound":
        return Flame;
      case "Retreat":
        return Leaf;
      default:
        return Sparkles;
    }
  };

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      if (hour >= 17 && hour < 21) return "Good evening";
      return "Good night";
    };

    const getStoredName = () => {
      const directName = localStorage.getItem("journey_profile_name");
      if (directName && directName.trim()) return directName.trim();

      const profileRaw = localStorage.getItem("journey_profile");
      if (profileRaw) {
        try {
          const parsed = JSON.parse(profileRaw) as { name?: string };
          if (parsed?.name && parsed.name.trim()) {
            return parsed.name.trim();
          }
        } catch {}
      }

      return "Seeker";
    };

    const userId = getOrCreateUserId();
    setGreeting(getGreeting());
    setDisplayName(getStoredName());

    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.fullName) {
          setDisplayName(data.fullName);
        }
      } catch {}
    };

    const loadPrograms = async () => {
      try {
        const res = await fetch("/api/programs?limit=3");
        if (!res.ok) return;
        const data = (await res.json()) as ProgramRecord[];
        setPrograms(data);
      } catch {}
    };

    loadProfile();
    loadPrograms();
  }, []);

  const handleFeedbackSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFeedbackStatus("");

    const userId = getOrCreateUserId();
    const payload =
      journalType === "journal"
        ? {
            type: "journal",
            prompt: "What felt spacious today?",
            message: journalEntry,
            userId,
          }
        : {
            type: "experience",
            program: experienceProgram,
            rating: experienceRating ? Number(experienceRating) : undefined,
            message: experienceMessage,
            userId,
          };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setFeedbackStatus("Thanks for sharing.");
        setJournalEntry("");
        setExperienceProgram("");
        setExperienceRating("");
        setExperienceMessage("");
      } else {
        setFeedbackStatus("Something went wrong. Try again.");
      }
    } catch {
      setFeedbackStatus("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <main className="phone">
        <TopBar title="The Art of Living" />

        <div className="content">
          <section className="hero surface">
            <div className="hero__content">
              <span className="eyebrow">
                {greeting}, {displayName}
              </span>
            <h1>Start your journey to inner peace</h1>
            <p>
              Join programs led by expert facilitators to calm your mind,
              rejuvenate your body, and nurture your spirit.
            </p>
              <div className="hero__actions">
                <button className="button button--primary">
                  <PlayCircle size={18} />
                  Begin meditation
                </button>
                <Link className="button button--ghost" href="/explore">
                  View programs
                </Link>
              </div>
            </div>
        </section>

        

          <section className="section">
            <div className="section__head">
              <h2>Upcoming programs</h2>
              <Link className="link" href="/explore">
                See all
              </Link>
            </div>
            <div className="program-list">
              {programs.map((program) => (
                <article key={program.slug} className="program-row surface">
                  <div className="program-row__icon">
                    {(() => {
                      const Icon = programIcon(program.tag);
                      return <Icon size={18} />;
                    })()}
                  </div>
                  <div className="program-row__main">
                    <p className="list-title">{program.title}</p>
                    <p className="list-meta">{program.duration}</p>
                  </div>
                  <div className="program-row__time">
                    <span>{program.day} · {program.date}</span>
                    <span>{program.time}</span>
                  </div>
                  <Link
                    className="mini-button program-row__cta"
                    href={`/programs/${program.slug}`}
                  >
                    View more
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Reflection</h2>
            </div>
            <article className="surface journal">
              <form className="journal-form" onSubmit={handleFeedbackSubmit}>
                <label>
                  Choose reflection type
                  <select
                    className="text-input"
                    value={journalType}
                    onChange={(event) =>
                      setJournalType(
                        event.target.value === "experience"
                          ? "experience"
                          : "journal"
                      )
                    }
                  >
                    <option value="journal">Daily reflection</option>
                    <option value="experience">Program feedback</option>
                  </select>
                </label>

                {journalType === "journal" ? (
                  <>
                    <div>
                      <p className="journal__title">What felt spacious today?</p>
                      <p className="journal__meta">
                        Capture one moment of ease, however small.
                      </p>
                    </div>
                    <label>
                      Your reflection
                      <textarea
                        className="text-input"
                        rows={4}
                        placeholder="Share your reflection..."
                        value={journalEntry}
                        onChange={(event) => setJournalEntry(event.target.value)}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="journal__title">How was your experience?</p>
                      <p className="journal__meta">
                        Share what you felt and what helped most.
                      </p>
                    </div>
                    <label>
                      Program or session
                      <input
                        className="text-input"
                        placeholder="e.g. Sunrise breath circle"
                        value={experienceProgram}
                        onChange={(event) => setExperienceProgram(event.target.value)}
                      />
                    </label>
                    <label>
                      Rating
                      <select
                        className="text-input"
                        value={experienceRating}
                        onChange={(event) => setExperienceRating(event.target.value)}
                      >
                        <option value="" disabled>
                          Select rating
                        </option>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Very good</option>
                        <option value="3">3 - Good</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Needs work</option>
                      </select>
                    </label>
                    <label>
                      Your feedback
                      <textarea
                        className="text-input"
                        rows={4}
                        placeholder="Share your thoughts..."
                        value={experienceMessage}
                        onChange={(event) => setExperienceMessage(event.target.value)}
                      />
                    </label>
                  </>
                )}
                <button
                  className="button button--secondary journal-submit"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
                {feedbackStatus && (
                  <p className="list-meta" aria-live="polite">
                    {feedbackStatus}
                  </p>
                )}
              </form>
            </article>
          </section>
        </div>

        <BottomNav active="home" />
      </main>
    </div>
  );
}
