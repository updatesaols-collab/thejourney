"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import type { RegistrationRecord } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/clientUser";

const AUTH_SESSION_KEY = "journey_auth_session";

type AuthSession = {
  email: string;
  loggedInAt: string;
};

export default function ProfileRegistrationsPage() {
  const [authSession] = useState<AuthSession | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as AuthSession;
      return parsed?.email ? parsed : null;
    } catch {
      return null;
    }
  });
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const isLoggedIn = Boolean(authSession?.email);

  useEffect(() => {
    if (!authSession?.email) return;
    const userId = getOrCreateUserId();
    const loadRegistrations = async () => {
      try {
        const res = await fetch(`/api/registrations?userId=${userId}`);
        if (!res.ok) return;
        const data = (await res.json()) as RegistrationRecord[];
        setRegistrations(data);
      } catch {}
    };
    loadRegistrations();
  }, [authSession?.email]);

  return (
    <div className="page profile-page">
      <main className="phone">
        <div className="content">
          <TopBar title="My registrations" showBack backHref="/profile" />

          {!isLoggedIn ? (
            <section className="section">
              <div className="surface profile-card">
                <p className="list-title">Log in required</p>
                <p className="list-meta">
                  Please log in to view your registrations.
                </p>
                <Link className="button button--primary" href="/profile">
                  Go to Profile
                </Link>
              </div>
            </section>
          ) : (
            <section className="section">
              <div className="program-list">
                {registrations.length === 0 ? (
                  <div className="empty surface">
                    <p>No registrations yet.</p>
                    <Link className="button button--ghost" href="/explore">
                      Browse programs
                    </Link>
                  </div>
                ) : (
                  registrations.map((item) => (
                    <article key={item.id} className="program-row surface">
                      <div className="program-row__main">
                        <p className="list-title">{item.programTitle}</p>
                        <p className="list-meta">
                          {[item.programDay, item.programDate]
                            .filter(Boolean)
                            .join(", ")}
                          {item.programTime ? ` · ${item.programTime}` : ""}
                        </p>
                      </div>
                      <div className="program-row__time">
                        <span>{item.programDuration || "Session"}</span>
                        {item.programTag && <span className="tag">{item.programTag}</span>}
                      </div>
                      {item.programSlug && (
                        <Link
                          className="mini-button program-row__cta"
                          href={`/programs/${item.programSlug}`}
                        >
                          View details
                        </Link>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
        <BottomNav active="profile" />
      </main>
    </div>
  );
}
