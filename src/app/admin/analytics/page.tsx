"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileText,
  MousePointerClick,
  UsersRound,
} from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type {
  InteractionAnalyticsSummary,
  InteractionEventRecord,
} from "@/lib/types";

const EMPTY_SUMMARY: InteractionAnalyticsSummary = {
  rangeDays: 7,
  totals: {
    totalEvents: 0,
    uniqueUsers: 0,
    pageViews: 0,
    clicks: 0,
    formSubmits: 0,
  },
  topPages: [],
  topActions: [],
  trend: [],
  recentEvents: [],
};

const formatEventType = (type: InteractionEventRecord["type"]) => {
  if (type === "page_view") return "Page view";
  if (type === "form_submit") return "Form submit";
  return "Click";
};

const formatRecentTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function AnalyticsPage() {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<InteractionAnalyticsSummary>(EMPTY_SUMMARY);

  useEffect(() => {
    const controller = new AbortController();

    const loadAnalytics = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/admin/analytics/interactions?days=${days}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error("Unable to load analytics");
        }
        const data = (await res.json()) as InteractionAnalyticsSummary;
        setSummary(data);
      } catch {
        if (!controller.signal.aborted) {
          setError("Unable to load interaction analytics.");
          setSummary(EMPTY_SUMMARY);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadAnalytics();

    return () => {
      controller.abort();
    };
  }, [days]);

  const trendMax = useMemo(() => {
    if (!summary.trend.length) return 1;
    return Math.max(...summary.trend.map((item) => item.events), 1);
  }, [summary.trend]);

  return (
    <AdminShell
      title="Analytics"
      subtitle="Track user interactions across the app"
    >
      <section className="admin__toolbar">
        <div className="admin__filters">
          <div className="admin__field">
            Time range
            <select
              value={String(days)}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value="1">Last 1 day</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
        </div>
      </section>
      {error && <div className="admin__status admin__status--error">{error}</div>}

      <section className="admin__stats">
        <div className="admin__card card--orange">
          <div>
            <p>Total events</p>
            <h3>{summary.totals.totalEvents}</h3>
          </div>
          <MousePointerClick size={28} />
        </div>
        <div className="admin__card card--green">
          <div>
            <p>Unique users</p>
            <h3>{summary.totals.uniqueUsers}</h3>
          </div>
          <UsersRound size={28} />
        </div>
        <div className="admin__card card--purple">
          <div>
            <p>Page views</p>
            <h3>{summary.totals.pageViews}</h3>
          </div>
          <Eye size={28} />
        </div>
        <div className="admin__card card--blue">
          <div>
            <p>Form submits</p>
            <h3>{summary.totals.formSubmits}</h3>
          </div>
          <FileText size={28} />
        </div>
      </section>

      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Interaction trend</h2>
            <p>Daily activity for the selected time range.</p>
          </div>
        </div>
        {loading ? (
          <p className="admin__hint">Loading trend...</p>
        ) : (
          <div className="admin__trend">
            {summary.trend.map((item) => (
              <div key={item.date} className="admin__trend-row">
                <span>{item.date}</span>
                <div className="admin__trend-bar">
                  <div
                    className="admin__trend-fill"
                    style={{ width: `${(item.events / trendMax) * 100}%` }}
                  />
                </div>
                <strong>{item.events}</strong>
                <small>{item.users} users</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin__grid">
        <section className="admin__panel">
          <div className="admin__panel-head">
            <div>
              <h2>Top pages</h2>
              <p>Most visited pages.</p>
            </div>
          </div>
          <div className="admin__list">
            {summary.topPages.length ? (
              summary.topPages.map((item) => (
                <div key={item.label} className="admin__list-item">
                  <div>
                    <strong>{item.label}</strong>
                  </div>
                  <span>{item.count} views</span>
                </div>
              ))
            ) : (
              <p className="admin__hint">No page views yet.</p>
            )}
          </div>
        </section>

        <section className="admin__panel">
          <div className="admin__panel-head">
            <div>
              <h2>Top actions</h2>
              <p>Most clicked controls and submitted forms.</p>
            </div>
          </div>
          <div className="admin__list">
            {summary.topActions.length ? (
              summary.topActions.map((item) => (
                <div key={item.label} className="admin__list-item">
                  <div>
                    <strong>{item.label}</strong>
                  </div>
                  <span>{item.count} actions</span>
                </div>
              ))
            ) : (
              <p className="admin__hint">No interaction events yet.</p>
            )}
          </div>
        </section>
      </section>

      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Recent interactions</h2>
            <p>Latest user activity captured in real time.</p>
          </div>
        </div>
        <div className="admin__list">
          {summary.recentEvents.length ? (
            summary.recentEvents.map((item) => (
              <div key={item.id} className="admin__list-item">
                <div>
                  <strong>
                    {formatEventType(item.type)}
                    {item.label ? ` · ${item.label}` : ""}
                  </strong>
                  <span>
                    {item.path}
                    {item.target ? ` → ${item.target}` : ""}
                  </span>
                </div>
                <span>{formatRecentTime(item.createdAt)}</span>
              </div>
            ))
          ) : (
            <p className="admin__hint">No recent events in this range.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
