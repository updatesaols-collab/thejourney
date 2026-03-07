"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Flame,
  Heart,
  Leaf,
  MapPin,
  PlayCircle,
  Search,
  Sparkles,
  Wind,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import type { ProgramRecord } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/clientUser";

const AUTH_SESSION_KEY = "journey_auth_session";

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

  const categories = [
    { label: "Breathwork", icon: Wind },
    { label: "Meditation", icon: Sparkles },
    { label: "Yoga", icon: Heart },
    { label: "Sound", icon: Flame },
    { label: "Retreat", icon: Leaf },
  ];

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      if (hour >= 17 && hour < 21) return "Good evening";
      return "Good night";
    };

    const sessionRaw =
      typeof window !== "undefined" ? localStorage.getItem(AUTH_SESSION_KEY) : null;
    const isLoggedIn = Boolean(sessionRaw);
    setGreeting(getGreeting());
    setDisplayName("Seeker");

    const loadProfile = async () => {
      if (!isLoggedIn) return;
      const userId = getOrCreateUserId();
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
        const res = await fetch("/api/programs?limit=4");
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
        <div className="content">
          <header className="home-header">
            <div className="location">
              <span className="location__label">
                <MapPin size={14} />
                Your journey
              </span>
              <button className="location__value" type="button">
                The Art of Living
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="icon-row">
              <button className="icon-button icon-button--soft" aria-label="Notifications">
                <Bell size={18} />
              </button>
              <span className="topbar__logo" aria-hidden="true">
                <Image
                  src="/artofliving.png"
                  alt="Art of Living logo"
                  width={36}
                  height={36}
                  priority
                />
              </span>
            </div>
          </header>

          <section className="home-search surface">
            <Search size={18} />
            <input placeholder="Search for a program..." aria-label="Search programs" />
          </section>

          <section className="home-banner surface">
            <div className="home-banner__content">
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
              <h2>Program categories</h2>
              <Link className="link" href="/explore">
                View all
              </Link>
            </div>
            <div className="category-grid">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.label} className="category-card surface">
                    <span className="category-card__icon">
                      <Icon size={18} />
                    </span>
                    <span className="category-card__label">{category.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Upcoming programs</h2>
              <Link className="link" href="/explore">
                View all
              </Link>
            </div>
            <div className="popular-grid">
              {programs.map((program) => {
                const Icon = programIcon(program.tag);
                return (
                  <article key={program.slug} className="popular-card surface">
                    <div className="popular-card__media">
                      {program.imageUrl ? (
                        <img
                          className="popular-card__image"
                          src={program.imageUrl}
                          alt={program.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="popular-card__icon">
                          <Icon size={20} />
                        </div>
                      )}
                      <span className="tag">{program.tag}</span>
                    </div>
                    <div className="popular-card__body">
                      <p className="popular-card__title">{program.title}</p>
                      <p className="popular-card__meta">
                        {program.day} · {program.date} · {program.time}
                      </p>
                      <p className="popular-card__summary">{program.summary}</p>
                      <div className="popular-card__footer">
                        <span className="popular-card__duration">{program.duration}</span>
                        <Link className="mini-button" href={`/programs/${program.slug}`}>
                          View details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
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
