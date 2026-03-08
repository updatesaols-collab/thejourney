"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import Link from "next/link";
import type { ProgramRecord } from "@/lib/types";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState(() => {
    if (typeof window === "undefined") return "All";
    return new URLSearchParams(window.location.search).get("tag") || "All";
  });

  const filters = useMemo(() => {
    const options = new Set<string>();
    programs.forEach((program) => options.add(program.tag));
    return ["All", ...Array.from(options)];
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesFilter =
        activeFilter === "All" || program.tag === activeFilter;
      const matchesQuery = program.title
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, programs, query]);

  const activeFilterAvailable =
    activeFilter === "All" || filters.includes(activeFilter);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await fetch("/api/programs");
        if (!res.ok) return;
        const data = (await res.json()) as ProgramRecord[];
        setPrograms(data);
      } catch {}
    };
    loadPrograms();
  }, []);

  return (
    <div className="page">
      <main className="phone">
        <div className="content">
          <TopBar title="Explore programs" showBack variant="explore" />

          <section className="searchbar">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search programs"
              aria-label="Search programs"
            />
          </section>

          <section className="filter-row">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`filter-chip ${
                  activeFilter === filter ? "filter-chip--active" : ""
                }`}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
            {!activeFilterAvailable && (
              <button
                className="filter-chip filter-chip--active"
                type="button"
                onClick={() => setActiveFilter("All")}
              >
                {activeFilter}
              </button>
            )}
          </section>

          <section className="section">
            <div className="section__head">
              <h2>All programs</h2>
              <span className="count">{filteredPrograms.length} sessions</span>
            </div>
            <div className="program-list">
              {filteredPrograms.map((program) => (
                <article
                  key={`${program.title}-${program.date}`}
                  className="program-card surface"
                >
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
                    <Link
                      className="mini-button"
                      href={`/programs/${program.slug}`}
                    >
                      View more
                    </Link>
                  </div>
                </article>
              ))}
              {filteredPrograms.length === 0 && (
                <div className="empty surface">
                  <p>No programs match your search.</p>
                  <button
                    className="button button--ghost"
                    onClick={() => {
                      setQuery("");
                      setActiveFilter("All");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <BottomNav active="explore" />
      </main>
    </div>
  );
}
