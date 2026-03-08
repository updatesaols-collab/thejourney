"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Heart,
  Leaf,
  Search,
  Sparkles,
  Wind,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import type { CategoryRecord, HeroSlideRecord, ProgramRecord } from "@/lib/types";
import { CATEGORY_ICON_MAP } from "@/lib/categoryIcons";
import { getOrCreateUserId } from "@/lib/clientUser";

const AUTH_SESSION_KEY = "journey_auth_session";
const FALLBACK_CATEGORIES: CategoryRecord[] = [
  {
    id: "breathwork",
    title: "Breathwork",
    tag: "Breathwork",
    imageUrl: "",
    iconName: "Wind",
    order: 0,
  },
  {
    id: "meditation",
    title: "Meditation",
    tag: "Meditation",
    imageUrl: "",
    iconName: "Sparkles",
    order: 1,
  },
  { id: "yoga", title: "Yoga", tag: "Yoga", imageUrl: "", iconName: "Heart", order: 2 },
  { id: "sound", title: "Sound", tag: "Sound", imageUrl: "", iconName: "Music", order: 3 },
  { id: "retreat", title: "Retreat", tag: "Retreat", imageUrl: "", iconName: "Leaf", order: 4 },
];

export default function Home() {
  const [greeting, setGreeting] = useState("Welcome");
  const [greetingTone, setGreetingTone] = useState<
    "morning" | "afternoon" | "evening" | "night"
  >("morning");
  const [displayName, setDisplayName] = useState("Seeker");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [journalType, setJournalType] = useState<"journal" | "experience">(
    "journal"
  );
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlideRecord[]>([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProgramRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
      if (hour >= 5 && hour < 12) return { text: "Good morning", tone: "morning" as const };
      if (hour >= 12 && hour < 17)
        return { text: "Good afternoon", tone: "afternoon" as const };
      if (hour >= 17 && hour < 21) return { text: "Good evening", tone: "evening" as const };
      return { text: "Good night", tone: "night" as const };
    };

    const sessionRaw =
      typeof window !== "undefined" ? localStorage.getItem(AUTH_SESSION_KEY) : null;
    let sessionEmail = "";
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw) as { email?: string };
        if (parsed?.email) sessionEmail = parsed.email;
      } catch {}
    }
    const isLoggedIn = Boolean(sessionEmail);
    setIsLoggedIn(isLoggedIn);
    const greetingMeta = getGreeting();
    setGreeting(greetingMeta.text);
    setGreetingTone(greetingMeta.tone);
    setDisplayName("Seeker");
    setIsProfileLoading(isLoggedIn);

    const loadProfile = async () => {
      if (!isLoggedIn) {
        setIsProfileLoading(false);
        return;
      }
      const userId = getOrCreateUserId();
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.fullName) {
          setDisplayName(data.fullName);
        }
      } catch {
      } finally {
        setIsProfileLoading(false);
      }
    };

    const loadPrograms = async () => {
      try {
        const res = await fetch("/api/programs?limit=4");
        if (!res.ok) return;
        const data = (await res.json()) as ProgramRecord[];
        setPrograms(data);
      } catch {}
    };

    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          setCategories(FALLBACK_CATEGORIES);
          return;
        }
        const data = (await res.json()) as CategoryRecord[];
        setCategories(data.length ? data : FALLBACK_CATEGORIES);
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      }
    };

    loadProfile();
    loadPrograms();
    loadCategories();
    const loadHeroSlides = async () => {
      try {
        const res = await fetch("/api/hero-slides?status=Active");
        if (!res.ok) return;
        const data = (await res.json()) as HeroSlideRecord[];
        setHeroSlides(data.sort((a, b) => a.order - b.order));
      } catch {}
    };
    loadHeroSlides();
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) {
      setActiveHeroIndex(0);
      return;
    }
    const total = heroSlides.length;
    setActiveHeroIndex((prev) => prev % total);
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides]);

  useEffect(() => {
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    let isActive = true;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/programs?q=${encodeURIComponent(term)}&limit=8`);
        if (!res.ok) return;
        const data = (await res.json()) as ProgramRecord[];
        if (isActive) {
          setSearchResults(data);
          setSearchOpen(true);
        }
      } catch {
      } finally {
        if (isActive) setIsSearching(false);
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const canShare = isLoggedIn;
  const showShareGate = !isProfileLoading && !isLoggedIn;

  const handleFeedbackSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!isLoggedIn) {
      setFeedbackStatus("Please log in to share a reflection.");
      return;
    }
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
          <TopBar title="The Art of Living" subtitle="Your journey" />

          <section className="home-search surface">
            <Search size={18} />
            <input
              placeholder="Search for a program..."
              aria-label="Search programs"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setSearchOpen(true);
              }}
              onBlur={() => {
                setTimeout(() => setSearchOpen(false), 150);
              }}
            />
            {searchOpen && (
              <div className="search-results surface">
                {isSearching && (
                  <div className="search-results__item search-results__hint">
                    Searching...
                  </div>
                )}
                {!isSearching && searchResults.length === 0 && (
                  <div className="search-results__item search-results__hint">
                    No programs found.
                  </div>
                )}
                {searchResults.map((program) => (
                  <Link
                    key={program.slug}
                    href={`/programs/${program.slug}`}
                    className="search-results__item"
                  >
                    {program.imageUrl ? (
                      <img
                        src={program.imageUrl}
                        alt={program.title}
                        loading="lazy"
                      />
                    ) : (
                      <span className="search-results__icon" aria-hidden="true" />
                    )}
                    <div>
                      <p className="search-results__title">{program.title}</p>
                      <span className="search-results__meta">
                        {program.date} · {program.time}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {heroSlides.length > 0 && (
            <section className="home-hero">
              <div className="home-hero__stack">
                {heroSlides.map((slide, index) => (
                  slide.link?.trim() ? (
                    <a
                      key={slide.id}
                      href={slide.link.trim()}
                      className={`home-banner home-banner--image surface is-link ${
                        activeHeroIndex === index ? "is-active" : ""
                      }`}
                      style={{ backgroundImage: `url(${slide.imageUrl})` }}
                      aria-hidden={activeHeroIndex !== index}
                    >
                      <span
                        className={`home-banner__greeting home-banner__greeting--${greetingTone}`}
                      >
                        {greeting}, {displayName}
                      </span>
                    </a>
                  ) : (
                    <div
                      key={slide.id}
                      className={`home-banner home-banner--image surface ${
                        activeHeroIndex === index ? "is-active" : ""
                      }`}
                      style={{ backgroundImage: `url(${slide.imageUrl})` }}
                      aria-hidden={activeHeroIndex !== index}
                    >
                      <span
                        className={`home-banner__greeting home-banner__greeting--${greetingTone}`}
                      >
                        {greeting}, {displayName}
                      </span>
                    </div>
                  )
                ))}
              </div>
              {heroSlides.length > 1 && (
                <div className="home-hero__dots">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={`hero-dot-${slide.id}`}
                      type="button"
                      className={`home-hero__dot ${
                        activeHeroIndex === index ? "is-active" : ""
                      }`}
                      onClick={() => setActiveHeroIndex(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="section">
            <div className="section__head">
              <h2>Program categories</h2>
              <Link className="link" href="/explore">
                View all
              </Link>
            </div>
            <div className="category-grid">
              {categories.map((category) => {
                const Icon =
                  (category.iconName && CATEGORY_ICON_MAP[category.iconName]) ||
                  programIcon(category.tag);
                return (
                  <Link
                    key={category.id}
                    className="category-card surface"
                    href={`/explore?tag=${encodeURIComponent(category.tag)}`}
                  >
                    <span className="category-card__icon">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.title} />
                      ) : (
                        <Icon size={18} />
                      )}
                    </span>
                    <span className="category-card__label">
                      {category.tag || category.title}
                    </span>
                  </Link>
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
                const venue = program.location || program.venue;
                return (
                  <article
                    key={program.slug}
                    className="popular-card popular-card--row surface"
                  >
                    <div className="popular-card__thumb">
                      {program.imageUrl ? (
                        <img src={program.imageUrl} alt={program.title} loading="lazy" />
                      ) : (
                        <span className="popular-card__thumb-icon">
                          <Icon size={22} />
                        </span>
                      )}
                    </div>
                    <div className="popular-card__content">
                      <p className="popular-card__title">{program.title}</p>
                      <div className="popular-card__meta">
                        <span>{program.date}</span>
                        <span>·</span>
                        <span>{program.time}</span>
                      </div>
                      {venue && <p className="popular-card__venue">{venue}</p>}
                    </div>
                    <div className="popular-card__aside">
                      <span className="popular-card__duration">{program.duration}</span>
                      <Link className="mini-button" href={`/programs/${program.slug}`}>
                        View details
                      </Link>
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
              {showShareGate && (
                <div className="journal__overlay" role="status" aria-live="polite">
                  <div className="journal__overlay-card">
                    <p>Please log in to share your reflections.</p>
                    <Link className="button button--ghost" href="/profile">
                      Log in
                    </Link>
                  </div>
                </div>
              )}
              <form className="journal-form" onSubmit={handleFeedbackSubmit}>
                <fieldset disabled={!canShare || isSubmitting}>
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
                </fieldset>
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
