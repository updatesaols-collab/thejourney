"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import type { ProfileSettings, RegistrationRecord } from "@/lib/types";
import { getOrCreateUserId } from "@/lib/clientUser";

const AUTH_SESSION_KEY = "journey_auth_session";

type AuthSession = {
  email: string;
  loggedInAt: string;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

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
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "create" | "forgot">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupStatus, setSignupStatus] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityStatus, setSecurityStatus] = useState("");
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const isLoggedIn = Boolean(authSession?.email);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(AUTH_SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthSession;
          if (parsed?.email) {
            setAuthSession(parsed);
            setLoginEmail(parsed.email);
          }
        } catch {}
      }
    }

  }, []);

  useEffect(() => {
    if (!authSession?.email) {
      setProfile({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        dob: "",
      });
      setSettings({
        emailUpdates: true,
        smsReminders: false,
        weeklyDigest: true,
      });
      setRegistrations([]);
      setSavedName("Seeker");
      return;
    }

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
  }, [authSession?.email]);

  useEffect(() => {
    if (!authSession && profile.email && !loginEmail) {
      setLoginEmail(profile.email);
    }
  }, [authSession, loginEmail, profile.email]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthStatus("");
    const email = normalizeEmail(loginEmail);
    if (!email || !loginPassword.trim()) {
      setAuthStatus("Enter your email and password to continue.");
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "" }));
        setAuthStatus(data.message || "Unable to log in.");
        return;
      }

      const session: AuthSession = { email, loggedInAt: new Date().toISOString() };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setAuthSession(session);
      setAuthStatus("Welcome back.");
      setLoginPassword("");
      if (!profile.email || profile.email === email) {
        setProfile((prev) => ({ ...prev, email }));
      }
    } catch {
      setAuthStatus("Unable to log in.");
    }
  };

  const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignupStatus("");
    const email = normalizeEmail(signupEmail);
    if (!email || !signupPassword || !signupConfirm) {
      setSignupStatus("Enter your email and confirm your password.");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupStatus("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: signupPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "" }));
        setSignupStatus(data.message || "Unable to create account.");
        return;
      }

      const session: AuthSession = { email, loggedInAt: new Date().toISOString() };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setAuthSession(session);
      setSignupStatus("Account created. You're now logged in.");
      setSignupPassword("");
      setSignupConfirm("");
      setLoginEmail(email);
      setLoginPassword("");
      setAuthMode("login");
      if (!profile.email || profile.email === email) {
        setProfile((prev) => ({ ...prev, email }));
      }
    } catch {
      setSignupStatus("Unable to create account.");
    }
  };

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotStatus("");
    const email = normalizeEmail(forgotEmail);
    if (!email) {
      setForgotStatus("Enter your email to continue.");
      return;
    }
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "" }));
        setForgotStatus(data.message || "Unable to send reset link.");
        return;
      }
      setForgotStatus("If an account exists, a reset link has been sent.");
    } catch {
      setForgotStatus("Unable to send reset link.");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem("journey_profile_name");
      localStorage.removeItem("journey_profile");
    }
    setAuthSession(null);
    setAuthStatus("Signed out.");
    setLoginPassword("");
    setAuthMode("login");
  };

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

  const handleProfileSave = async () => {
    if (!isLoggedIn) return;
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
        <TopBar title="Profile" showBack />
        <div className="content">
          {status && <div className="status-pill surface">{status}</div>}

          <section className="section">
            <div className="section__head">
              <h2>Account access</h2>
            </div>
            <div className="surface profile-card">
              {isLoggedIn ? (
                <>
                  <div className="profile-header">
                    <div>
                      <p className="list-title">Signed in</p>
                      <p className="list-meta">{authSession?.email}</p>
                    </div>
                    <button className="button button--ghost" onClick={handleLogout}>
                      Log out
                    </button>
                  </div>
                  {authStatus && <p className="list-meta">{authStatus}</p>}
                </>
              ) : (
                <>
                  <div>
                    <p className="list-title">Log in to your profile</p>
                    <p className="list-meta">
                      Log in to edit your profile, settings, and security.
                    </p>
                  </div>
                  {authMode === "login" && (
                    <>
                      <form className="profile-form" onSubmit={handleLogin}>
                        <label>
                          Email
                          <input
                            className="text-input"
                            value={loginEmail}
                            onChange={(event) => setLoginEmail(event.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            autoComplete="email"
                          />
                        </label>
                        <label>
                          Password
                          <input
                            className="text-input"
                            value={loginPassword}
                            onChange={(event) => setLoginPassword(event.target.value)}
                            placeholder="Enter your password"
                            type="password"
                            autoComplete="current-password"
                          />
                        </label>
                        <div className="auth-actions">
                          <button className="button button--primary" type="submit">
                            Log in
                          </button>
                        </div>
                      </form>
                      {authStatus && <p className="list-meta">{authStatus}</p>}
                      <div className="auth-links">
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => setAuthMode("create")}
                        >
                          Create account
                        </button>
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => setAuthMode("forgot")}
                        >
                          Forgot password?
                        </button>
                      </div>
                    </>
                  )}
                  {authMode === "create" && (
                    <>
                      <form className="profile-form" onSubmit={handleCreateAccount}>
                        <label>
                          Email
                          <input
                            className="text-input"
                            value={signupEmail}
                            onChange={(event) => setSignupEmail(event.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            autoComplete="email"
                          />
                        </label>
                        <label>
                          Password
                          <input
                            className="text-input"
                            value={signupPassword}
                            onChange={(event) => setSignupPassword(event.target.value)}
                            placeholder="Create a password"
                            type="password"
                            autoComplete="new-password"
                          />
                        </label>
                        <label>
                          Confirm password
                          <input
                            className="text-input"
                            value={signupConfirm}
                            onChange={(event) => setSignupConfirm(event.target.value)}
                            placeholder="Confirm your password"
                            type="password"
                            autoComplete="new-password"
                          />
                        </label>
                        <div className="auth-actions">
                          <button className="button button--primary" type="submit">
                            Create account
                          </button>
                        </div>
                      </form>
                      {signupStatus && <p className="list-meta">{signupStatus}</p>}
                      <div className="auth-links">
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => setAuthMode("login")}
                        >
                          Already have an account? Log in
                        </button>
                      </div>
                    </>
                  )}
                  {authMode === "forgot" && (
                    <>
                      <form className="profile-form" onSubmit={handleForgotPassword}>
                        <label>
                          Email
                          <input
                            className="text-input"
                            value={forgotEmail}
                            onChange={(event) => setForgotEmail(event.target.value)}
                            placeholder="you@example.com"
                            type="email"
                            autoComplete="email"
                          />
                        </label>
                        <div className="auth-actions">
                          <button className="button button--primary" type="submit">
                            Send reset link
                          </button>
                        </div>
                      </form>
                      {forgotStatus && <p className="list-meta">{forgotStatus}</p>}
                      <p className="list-meta">
                        We’ll email you a secure link to reset your password.
                      </p>
                      <div className="auth-links">
                        <button
                          className="link-button"
                          type="button"
                          onClick={() => setAuthMode("login")}
                        >
                          Back to login
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </section>

          {isLoggedIn && (
            <>
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
                    <button className="button button--primary" onClick={handleProfileSave}>
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
                          {item.programTag && (
                            <span className="tag">{item.programTag}</span>
                          )}
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
            </>
          )}
        </div>
        <BottomNav active="profile" />
      </main>
    </div>
  );
}
