"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import type { ProfileSettings } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/clientUser";

const AUTH_SESSION_KEY = "journey_auth_session";

type AuthSession = {
  email: string;
  loggedInAt: string;
};

const defaultSettings: ProfileSettings = {
  emailUpdates: true,
  smsReminders: false,
  weeklyDigest: true,
};

export default function ProfileSettingsPage() {
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
  const [settings, setSettings] = useState<ProfileSettings>(defaultSettings);
  const [status, setStatus] = useState("");
  const isLoggedIn = Boolean(authSession?.email);

  useEffect(() => {
    if (!authSession?.email) return;
    const userId = getOrCreateUserId();
    const loadSettings = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.settings) {
          setSettings(data.settings);
        }
      } catch {}
    };
    loadSettings();
  }, [authSession?.email]);

  const handleSave = async () => {
    if (!isLoggedIn) return;
    const userId = getOrCreateUserId();
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, settings }),
      });
      if (res.ok) {
        setStatus("Settings saved");
      } else {
        setStatus("Unable to save settings");
      }
    } catch {
      setStatus("Unable to save settings");
    }
    setTimeout(() => setStatus(""), 2000);
  };

  return (
    <div className="page profile-page">
      <main className="phone">
        <div className="content">
          <TopBar title="Settings" showBack backHref="/profile" />
          {status && <div className="status-pill surface">{status}</div>}

          {!isLoggedIn ? (
            <section className="section">
              <div className="surface profile-card">
                <p className="list-title">Log in required</p>
                <p className="list-meta">Please log in to edit your settings.</p>
                <Link className="button button--primary" href="/profile">
                  Go to Profile
                </Link>
              </div>
            </section>
          ) : (
            <section className="section">
              <div className="surface settings-card">
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.emailUpdates}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        emailUpdates: event.target.checked,
                      })
                    }
                  />
                  <span>Email updates</span>
                </label>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.smsReminders}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        smsReminders: event.target.checked,
                      })
                    }
                  />
                  <span>SMS reminders</span>
                </label>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={(event) =>
                      setSettings({
                        ...settings,
                        weeklyDigest: event.target.checked,
                      })
                    }
                  />
                  <span>Weekly digest</span>
                </label>
                <button className="button button--secondary" onClick={handleSave}>
                  Save settings
                </button>
              </div>
            </section>
          )}
        </div>
        <BottomNav active="profile" />
      </main>
    </div>
  );
}
