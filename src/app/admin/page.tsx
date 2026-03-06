"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import AdminShell from "./_components/AdminShell";
import type { FeedbackRecord, ProgramRecord, RegistrationRecord } from "@/lib/types";

export default function AdminDashboard() {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [programs, setPrograms] = useState<ProgramRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [registrationsRes, programsRes, feedbackRes] = await Promise.all([
          fetch("/api/registrations"),
          fetch("/api/programs"),
          fetch("/api/feedback"),
        ]);
        if (registrationsRes.ok) {
          setRegistrations((await registrationsRes.json()) as RegistrationRecord[]);
        }
        if (programsRes.ok) {
          setPrograms((await programsRes.json()) as ProgramRecord[]);
        }
        if (feedbackRes.ok) {
          setFeedbacks((await feedbackRes.json()) as FeedbackRecord[]);
        }
      } catch {}
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const totalRegistrations = registrations.length;
    const upcomingPrograms = programs.filter((p) => p.status !== "Closed").length;
    const ratingValues = feedbacks
      .map((item) => item.rating)
      .filter((value): value is number => typeof value === "number");
    const averageRating = ratingValues.length
      ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length).toFixed(1)
      : "0";
    const totalFeedback = feedbacks.length;
    return { totalRegistrations, upcomingPrograms, averageRating, totalFeedback };
  }, [registrations, programs, feedbacks]);

  const formatDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Operational overview for Journey programs"
    >
      <section className="admin__stats">
        <div className="admin__card card--orange">
          <div>
            <p>Total registrations</p>
            <h3>{stats.totalRegistrations}</h3>
          </div>
          <ClipboardList size={28} />
        </div>
        <div className="admin__card card--green">
          <div>
            <p>Upcoming programs</p>
            <h3>{stats.upcomingPrograms}</h3>
          </div>
          <CalendarDays size={28} />
        </div>
        <div className="admin__card card--purple">
          <div>
            <p>Average rating</p>
            <h3>{stats.averageRating}</h3>
          </div>
          <Activity size={28} />
        </div>
        <div className="admin__card card--blue">
          <div>
            <p>Total feedback</p>
            <h3>{stats.totalFeedback}</h3>
          </div>
          <MessageSquare size={28} />
        </div>
      </section>

      <section className="admin__grid">
        <div className="admin__panel">
          <div className="admin__panel-head">
            <div>
              <h2>Recent registrations</h2>
              <p>Latest sign-ups across programs.</p>
            </div>
            <Link className="admin__panel-link" href="/admin/registrations">
              View all
            </Link>
          </div>
          <div className="admin__list">
            {registrations.slice(0, 4).map((item) => (
              <div key={item.id} className="admin__list-item">
                <div>
                  <strong>{item.fullName}</strong>
                  <span>{item.programTitle}</span>
                </div>
                <span>{formatDate(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin__panel">
          <div className="admin__panel-head">
            <div>
              <h2>Upcoming programs</h2>
              <p>Next sessions and facilitator info.</p>
            </div>
            <Link className="admin__panel-link" href="/admin/programs">
              Manage
            </Link>
          </div>
          <div className="admin__list">
            {programs.slice(0, 4).map((item) => (
              <div key={item.id} className="admin__list-item">
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.facilitator}</span>
                </div>
                <span>{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin__panel">
          <div className="admin__panel-head">
            <div>
              <h2>Recent feedback</h2>
              <p>Latest participant responses.</p>
            </div>
            <Link className="admin__panel-link" href="/admin/feedback">
              Review
            </Link>
          </div>
          <div className="admin__list">
            {feedbacks.slice(0, 4).map((item) => (
              <div key={item.id} className="admin__list-item">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.program}</span>
                </div>
                <span>{item.rating ? `${item.rating}/5` : "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin__panel">
          <div className="admin__panel-head">
            <div>
              <h2>Weekly pulse</h2>
              <p>Quick snapshot of growth and engagement.</p>
            </div>
          </div>
          <div className="admin__pulse">
            <div>
              <h3>+12%</h3>
              <p>Registrations this week</p>
            </div>
            <div>
              <h3>4.8</h3>
              <p>Average satisfaction score</p>
            </div>
            <div>
              <h3>68%</h3>
              <p>Returning participants</p>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
