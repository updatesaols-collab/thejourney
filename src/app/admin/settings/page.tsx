"use client";

import { useState } from "react";
import AdminShell from "../_components/AdminShell";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    registrationAlerts: true,
    feedbackAlerts: true,
    weeklyReport: true,
  });

  return (
    <AdminShell
      title="Settings"
      subtitle="Control notifications and exports"
    >
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Notifications</h2>
            <p>Choose which updates to receive.</p>
          </div>
        </div>
        <div className="admin__settings">
          <label className="admin__toggle">
            <input
              type="checkbox"
              checked={settings.registrationAlerts}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  registrationAlerts: event.target.checked,
                })
              }
            />
            Registration alerts
          </label>
          <label className="admin__toggle">
            <input
              type="checkbox"
              checked={settings.feedbackAlerts}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  feedbackAlerts: event.target.checked,
                })
              }
            />
            Feedback alerts
          </label>
          <label className="admin__toggle">
            <input
              type="checkbox"
              checked={settings.weeklyReport}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  weeklyReport: event.target.checked,
                })
              }
            />
            Weekly report email
          </label>
        </div>
      </section>

      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Exports</h2>
            <p>Control default export preferences.</p>
          </div>
        </div>
        <div className="admin__settings">
          <div>
            <h4>Default export format</h4>
            <p>CSV (can be changed during export)</p>
          </div>
          <div>
            <h4>Storage location</h4>
            <p>Local browser storage</p>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
