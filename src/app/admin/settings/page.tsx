"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "../_components/AdminShell";

const ADMIN_PROFILE_STORAGE_KEY = "journey_admin_profile";

type AdminProfile = {
  fullName: string;
  role: string;
  email: string;
};

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  fullName: "Admin",
  role: "Operations",
  email: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    registrationAlerts: true,
    feedbackAlerts: true,
    weeklyReport: true,
  });
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(() => {
    if (typeof window === "undefined") return DEFAULT_ADMIN_PROFILE;
    const stored = window.localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
    if (!stored) return DEFAULT_ADMIN_PROFILE;
    try {
      const parsed = JSON.parse(stored) as Partial<AdminProfile>;
      return {
        fullName: parsed.fullName?.trim() || DEFAULT_ADMIN_PROFILE.fullName,
        role: parsed.role?.trim() || DEFAULT_ADMIN_PROFILE.role,
        email: parsed.email?.trim() || "",
      };
    } catch {
      return DEFAULT_ADMIN_PROFILE;
    }
  });
  const [profileStatus, setProfileStatus] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSaveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextProfile: AdminProfile = {
      fullName: adminProfile.fullName.trim() || DEFAULT_ADMIN_PROFILE.fullName,
      role: adminProfile.role.trim() || DEFAULT_ADMIN_PROFILE.role,
      email: adminProfile.email.trim(),
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      window.dispatchEvent(new Event("admin-profile-updated"));
    }
    setAdminProfile(nextProfile);
    setProfileStatus("Profile updated.");
    setTimeout(() => setProfileStatus(""), 2200);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setProfileStatus("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) {
        setProfileStatus("Unable to log out right now.");
        setIsLoggingOut(false);
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
      }
      router.replace("/admin-signed-out");
      router.refresh();
    } catch {
      setProfileStatus("Unable to log out right now.");
      setIsLoggingOut(false);
    }
  };

  return (
    <AdminShell
      title="Settings"
      subtitle="Control notifications and exports"
    >
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Admin profile</h2>
            <p>Update your top-bar identity details.</p>
          </div>
        </div>
        <form className="admin-modal__form" onSubmit={handleSaveProfile}>
          <label>
            Full name
            <input
              value={adminProfile.fullName}
              onChange={(event) =>
                setAdminProfile((prev) => ({ ...prev, fullName: event.target.value }))
              }
              placeholder="Admin"
            />
          </label>
          <label>
            Role
            <input
              value={adminProfile.role}
              onChange={(event) =>
                setAdminProfile((prev) => ({ ...prev, role: event.target.value }))
              }
              placeholder="Operations"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={adminProfile.email}
              onChange={(event) =>
                setAdminProfile((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="admin@thejourney.app"
            />
          </label>
          <div className="admin__profile-actions">
            <button className="admin__button" type="submit">
              Save profile
            </button>
            <button
              className="admin__button outline danger"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </form>
        {profileStatus && (
          <div className="admin__status admin__status--success">{profileStatus}</div>
        )}
      </section>

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
