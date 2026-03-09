"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { useStoredAuthSession } from "@/lib/clientAuth";
import type { RitualRecord } from "@/lib/types";

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function RitualDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const authSession = useStoredAuthSession();
  const [ritual, setRitual] = useState<RitualRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authSession?.email || !params?.id) return;
    const loadRitual = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/rituals/${params.id}`);
        if (!res.ok) {
          setError("Unable to load ritual.");
          return;
        }
        const data = (await res.json()) as RitualRecord;
        setRitual(data);
      } catch {
        setError("Unable to load ritual.");
      } finally {
        setLoading(false);
      }
    };

    loadRitual();
  }, [authSession?.email, params?.id]);

  return (
    <div className="page">
      <main className="phone">
        <div className="content">
          <TopBar title="Ritual" showBack backHref="/rituals" />

          {!authSession?.email ? (
            <section className="section">
              <div className="surface profile-card">
                <p className="list-title">Log in required</p>
                <p className="list-meta">Please log in to view your ritual notes.</p>
                <Link className="button button--primary" href="/profile">
                  Go to Profile
                </Link>
              </div>
            </section>
          ) : loading ? (
            <section className="section">
              <div className="empty surface">
                <p>Loading ritual...</p>
              </div>
            </section>
          ) : error || !ritual ? (
            <section className="section">
              <div className="empty surface">
                <p>{error || "Ritual not found."}</p>
                <button className="button button--ghost" type="button" onClick={() => router.push("/rituals")}>
                  Back to rituals
                </button>
              </div>
            </section>
          ) : (
            <section className="section">
              <article className="surface ritual-detail">
                <div className="ritual-detail__head">
                  <div>
                    <p className="ritual-detail__date">
                      Updated {formatDate(ritual.updatedAt || ritual.createdAt)}
                    </p>
                    <h1>{ritual.title}</h1>
                  </div>
                  <Link className="button button--ghost" href="/rituals">
                    Back to notebook
                  </Link>
                </div>
                <div
                  className="richtext-display ritual-detail__body"
                  dangerouslySetInnerHTML={{ __html: ritual.content }}
                />
              </article>
            </section>
          )}
        </div>
        <BottomNav active="rituals" />
      </main>
    </div>
  );
}
