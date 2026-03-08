"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";

const AUTH_SESSION_KEY = "journey_auth_session";

type AuthSession = {
  email: string;
  loggedInAt: string;
};

export default function ProfileSecurityPage() {
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityStatus, setSecurityStatus] = useState("");
  const isLoggedIn = Boolean(authSession?.email);

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authSession?.email) return;
    setSecurityStatus("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityStatus("Fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityStatus("New passwords do not match.");
      return;
    }
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authSession.email,
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "" }));
        setSecurityStatus(data.message || "Unable to update password.");
        return;
      }
      setSecurityStatus("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setSecurityStatus("Unable to update password.");
    }
  };

  return (
    <div className="page profile-page">
      <main className="phone">
        <div className="content">
          <TopBar title="Security" showBack backHref="/profile" />

          {!isLoggedIn ? (
            <section className="section">
              <div className="surface profile-card">
                <p className="list-title">Log in required</p>
                <p className="list-meta">
                  Please log in to change your password.
                </p>
                <Link className="button button--primary" href="/profile">
                  Go to Profile
                </Link>
              </div>
            </section>
          ) : (
            <section className="section">
              <div className="surface profile-card">
                <form className="profile-form" onSubmit={handleChangePassword}>
                  <div className="profile-grid">
                    <label>
                      Current password
                      <input
                        className="text-input"
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        autoComplete="current-password"
                      />
                    </label>
                    <label>
                      New password
                      <input
                        className="text-input"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                      />
                    </label>
                    <label>
                      Confirm new password
                      <input
                        className="text-input"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                      />
                    </label>
                  </div>
                  <div className="auth-actions">
                    <button className="button button--primary" type="submit">
                      Change password
                    </button>
                  </div>
                  {securityStatus && <p className="list-meta">{securityStatus}</p>}
                </form>
              </div>
            </section>
          )}
        </div>
        <BottomNav active="profile" />
      </main>
    </div>
  );
}
