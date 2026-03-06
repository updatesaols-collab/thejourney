"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import type { ProfileSettings, RegistrationRecord } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/clientUser";

export default function ProfilePage() {
  const [savedName, setSavedName] = useState("Seeker");
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dob: "",
  });
  const [settings, setSettings] = useState<ProfileSettings>({
    emailUpdates: true,
    smsReminders: false,
    weeklyDigest: true,
  });
  const [status, setStatus] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);

  useEffect(() => {
    const userId = getOrCreateUserId();

    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        setProfile({
          fullName: data.fullName ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          dob: data.dob ?? "",
        });
        if (data.fullName) {
          setSavedName(data.fullName);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
      } catch {}
    };

    const loadRegistrations = async () => {
      try {
        const res = await fetch(`/api/registrations?userId=${userId}`);
        if (!res.ok) return;
        const data = (await res.json()) as RegistrationRecord[];
        setRegistrations(data);
      } catch {}
    };

    loadProfile();
    loadRegistrations();
  }, []);

  const handleProfileSave = async () => {
    const userId = getOrCreateUserId();
    const trimmed = profile.fullName.trim();
    const payload = { ...profile, fullName: trimmed, userId, settings };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (trimmed) {
          localStorage.setItem("journey_profile_name", trimmed);
          setSavedName(trimmed);
        }
        setStatus("Profile updated");
      } else {
        setStatus("Unable to update profile");
      }
    } catch {
      setStatus("Unable to update profile");
    }
    setTimeout(() => setStatus(""), 2000);
  };

  const handleSettingsSave = async () => {
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
    <div className="page">
      <main className="phone">
        <TopBar title="Profile" showBack />
        <div className="content">
          {status && <div className="status-pill surface">{status}</div>}

          <section className="section">
            <div className="section__head">
              <h2>Personal details</h2>
            </div>
            <div className="surface profile-card">
              <div className="profile-header">
                <div>
                  <p className="list-title">Profile information</p>
                  <p className="list-meta">Currently: {savedName}</p>
                </div>
                <button
                  className="button button--primary"
                  onClick={handleProfileSave}
                >
                  Update profile
                </button>
              </div>

              <div className="profile-grid">
                <label>
                  Full name
                  <input
                    className="text-input"
                    value={profile.fullName}
                    onChange={(event) =>
                      setProfile({ ...profile, fullName: event.target.value })
                    }
                    placeholder="Enter your full name"
                  />
                </label>
                <label>
                  Email
                  <input
                    className="text-input"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile({ ...profile, email: event.target.value })
                    }
                    placeholder="Enter your email"
                    type="email"
                  />
                </label>
                <label>
                  Phone
                  <input
                    className="text-input"
                    value={profile.phone}
                    onChange={(event) =>
                      setProfile({ ...profile, phone: event.target.value })
                    }
                    placeholder="Enter your phone"
                    type="tel"
                  />
                </label>
                <label>
                  Address
                  <input
                    className="text-input"
                    value={profile.address}
                    onChange={(event) =>
                      setProfile({ ...profile, address: event.target.value })
                    }
                    placeholder="Enter your address"
                  />
                </label>
                <label>
                  Date of birth
                  <input
                    className="text-input"
                    value={profile.dob}
                    onChange={(event) =>
                      setProfile({ ...profile, dob: event.target.value })
                    }
                    type="date"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>My registrations</h2>
              <Link className="link" href="/explore">
                View all
              </Link>
            </div>
            <div className="program-list">
              {registrations.length === 0 ? (
                <div className="empty surface">
                  <p>No registrations yet.</p>
                  <Link className="button button--ghost" href="/explore">
                    Browse programs
                  </Link>
                </div>
              ) : (
                registrations.slice(0, 2).map((item) => (
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

          <section className="section">
            <div className="section__head">
              <h2>Settings</h2>
            </div>
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
              <button className="button button--secondary" onClick={handleSettingsSave}>
                Save settings
              </button>
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2>Security</h2>
            </div>
            <div className="surface profile-card">
              <div className="profile-grid">
                <label>
                  Current password
                  <input className="text-input" type="password" />
                </label>
                <label>
                  New password
                  <input className="text-input" type="password" />
                </label>
                <label>
                  Confirm new password
                  <input className="text-input" type="password" />
                </label>
              </div>
              <button className="button button--primary">Change password</button>
            </div>
          </section>
        </div>
        <BottomNav active="profile" />
      </main>
    </div>
  );
}
