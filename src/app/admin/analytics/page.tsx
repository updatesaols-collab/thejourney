"use client";

import AdminShell from "../_components/AdminShell";

export default function AnalyticsPage() {
  return (
    <AdminShell
      title="Analytics"
      subtitle="Track performance and engagement metrics"
    >
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Weekly pulse</h2>
            <p>Key indicators for the last 7 days.</p>
          </div>
        </div>
        <div className="admin__pulse">
          <div>
            <h3>+12%</h3>
            <p>Registrations</p>
          </div>
          <div>
            <h3>4.8</h3>
            <p>Average rating</p>
          </div>
          <div>
            <h3>68%</h3>
            <p>Returning participants</p>
          </div>
        </div>
      </section>

      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Engagement highlights</h2>
            <p>Session completion and feedback momentum.</p>
          </div>
        </div>
        <div className="admin__settings">
          <div>
            <h4>Top performing program</h4>
            <p>Happiness Program · 96% completion rate</p>
          </div>
          <div>
            <h4>Feedback volume</h4>
            <p>+24 new reflections this week</p>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
