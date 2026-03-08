"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import type { FeedbackRecord } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/clientUser";

const AUTH_SESSION_KEY = "journey_auth_session";

type AuthSession = {
  email: string;
  loggedInAt: string;
};

export default function ProfileReflectionsPage() {
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
  const [feedbackItems, setFeedbackItems] = useState<FeedbackRecord[]>([]);
  const isLoggedIn = Boolean(authSession?.email);

  useEffect(() => {
    if (!authSession?.email) return;
    const userId = getOrCreateUserId();
    const loadFeedback = async () => {
      try {
        const res = await fetch(`/api/feedback?userId=${userId}`);
        if (!res.ok) return;
        const data = (await res.json()) as FeedbackRecord[];
        setFeedbackItems(data);
      } catch {}
    };
    loadFeedback();
  }, [authSession?.email]);

  return (
    <div className="page profile-page">
      <main className="phone">
        <div className="content">
          <TopBar title="My reflections" showBack backHref="/profile" />

          {!isLoggedIn ? (
            <section className="section">
              <div className="surface profile-card">
                <p className="list-title">Log in required</p>
                <p className="list-meta">
                  Please log in to view your reflections.
                </p>
                <Link className="button button--primary" href="/profile">
                  Go to Profile
                </Link>
              </div>
            </section>
          ) : (
            <section className="section">
              <div className="feedback-list">
                {feedbackItems.length === 0 ? (
                  <div className="empty surface">
                    <p>No reflections yet.</p>
                    <Link className="button button--ghost" href="/">
                      Share reflection
                    </Link>
                  </div>
                ) : (
                  feedbackItems.map((item) => (
                    <article key={item.id} className="feedback-row surface">
                      <div className="feedback-row__main">
                        <p className="list-title">
                          {item.type === "experience"
                            ? "Program feedback"
                            : "Daily reflection"}
                        </p>
                        {item.program && (
                          <p className="list-meta">Program: {item.program}</p>
                        )}
                        {item.prompt && item.type === "journal" && (
                          <p className="list-meta">{item.prompt}</p>
                        )}
                        <p className="feedback-row__message">{item.message}</p>
                      </div>
                      <div className="feedback-row__aside">
                        {item.rating ? <span>{item.rating} / 5</span> : null}
                        {item.createdAt && (
                          <span>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
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
