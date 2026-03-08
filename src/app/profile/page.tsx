"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CalendarDays,
  ChevronRight,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  User2,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import {
  clearStoredAuthSession,
  setStoredAuthSession,
  type AuthSession,
  useStoredAuthSession,
} from "@/lib/clientAuth";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export default function ProfilePage() {
  const [savedName, setSavedName] = useState("Seeker");
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
    phone: "",
    address: "",
    dob: "",
  });
  const [avatarStatus, setAvatarStatus] = useState("");
  const authSession = useStoredAuthSession();
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isLoggedIn = Boolean(authSession?.email);

  useEffect(() => {
    if (!authSession?.email) {
      setProfile({
        fullName: "",
        email: "",
        avatarUrl: "",
        phone: "",
        address: "",
        dob: "",
      });
      setSavedName("Seeker");
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        setProfile({
          fullName: data.fullName ?? "",
          email: data.email ?? "",
          avatarUrl: data.avatarUrl ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          dob: data.dob ?? "",
        });
        if (data.fullName) {
          setSavedName(data.fullName);
        }
      } catch {}
    };

    loadProfile();
  }, [authSession?.email]);

  useEffect(() => {
    if (!authSession && profile.email && !loginEmail) {
      setLoginEmail(profile.email);
    }
  }, [authSession, loginEmail, profile.email]);

  useEffect(() => {
    if (authSession?.email) {
      setProfile((prev) => ({
        ...prev,
        email: authSession.email,
      }));
    }
  }, [authSession?.email]);

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
      setStoredAuthSession(session);
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
      setStoredAuthSession(session);
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    clearStoredAuthSession();
    if (typeof window !== "undefined") {
      localStorage.removeItem("journey_profile_name");
      localStorage.removeItem("journey_profile");
    }
    setAuthStatus("Signed out.");
    setLoginPassword("");
    setAuthMode("login");
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isLoggedIn) {
      setAvatarStatus("Please log in to upload a photo.");
      return;
    }
    setAvatarStatus("Uploading photo...");
    try {
      const signRes = await fetch("/api/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "the-journey/avatars" }),
      });
      if (!signRes.ok) {
        setAvatarStatus("Unable to upload photo.");
        return;
      }
      const data = (await signRes.json()) as {
        cloudName: string;
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
      };
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", data.apiKey);
      formData.append("timestamp", String(data.timestamp));
      formData.append("signature", data.signature);
      formData.append("folder", data.folder);
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) {
        setAvatarStatus("Unable to upload photo.");
        return;
      }
      const uploadData = (await uploadRes.json()) as {
        secure_url?: string;
        url?: string;
      };
      const avatarUrl = uploadData.secure_url || uploadData.url || "";
      if (!avatarUrl) {
        setAvatarStatus("Unable to upload photo.");
        return;
      }
      setProfile((prev) => ({ ...prev, avatarUrl }));

      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });
      setAvatarStatus("Profile photo updated.");
    } catch {
      setAvatarStatus("Unable to upload photo.");
    } finally {
      event.target.value = "";
      setTimeout(() => setAvatarStatus(""), 2000);
    }
  };

  return (
    <div className="page profile-page">
      <main className="phone">
        <div className="content">
          <TopBar title="Profile" showBack />

          {isLoggedIn && (
            <>
              <section className="section">
                <div className="surface profile-hero">
                  <div className="profile-hero__avatar">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt={profile.fullName || "Profile"} />
                    ) : (
                      <span>
                        {(profile.fullName || authSession?.email || "S")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                    <label className="profile-hero__upload" aria-label="Upload photo">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                      <Camera size={14} />
                    </label>
                  </div>
                  <div className="profile-hero__meta">
                    <p className="profile-hero__name">
                      {profile.fullName || savedName || "Seeker"}
                    </p>
                    <p className="profile-hero__handle">
                      {authSession?.email || profile.email}
                    </p>
                    {avatarStatus && <p className="list-meta">{avatarStatus}</p>}
                  </div>
                  <Link className="button button--coral" href="/profile/details">
                    Edit profile
                  </Link>
                </div>
              </section>

              <section className="section">
                <div className="surface profile-actions">
                  <Link className="profile-action" href="/profile/details">
                    <span className="profile-action__icon">
                      <User2 size={18} />
                    </span>
                    <span className="profile-action__label">Personal details</span>
                    <ChevronRight size={18} className="profile-action__chevron" />
                  </Link>
                  <Link className="profile-action" href="/profile/registrations">
                    <span className="profile-action__icon">
                      <CalendarDays size={18} />
                    </span>
                    <span className="profile-action__label">My registrations</span>
                    <ChevronRight size={18} className="profile-action__chevron" />
                  </Link>
                  <Link className="profile-action" href="/profile/reflections">
                    <span className="profile-action__icon">
                      <MessageSquare size={18} />
                    </span>
                    <span className="profile-action__label">My reflections</span>
                    <ChevronRight size={18} className="profile-action__chevron" />
                  </Link>
                  <Link className="profile-action" href="/profile/settings">
                    <span className="profile-action__icon">
                      <Settings size={18} />
                    </span>
                    <span className="profile-action__label">Settings</span>
                    <ChevronRight size={18} className="profile-action__chevron" />
                  </Link>
                  <Link className="profile-action" href="/profile/security">
                    <span className="profile-action__icon">
                      <Shield size={18} />
                    </span>
                    <span className="profile-action__label">Security</span>
                    <ChevronRight size={18} className="profile-action__chevron" />
                  </Link>
                  <Link className="profile-action" href="/profile/support">
                    <span className="profile-action__icon">
                      <LifeBuoy size={18} />
                    </span>
                    <span className="profile-action__label">Contact & support</span>
                    <ChevronRight size={18} className="profile-action__chevron" />
                  </Link>
                  <button
                    className="profile-action profile-action--danger"
                    type="button"
                    onClick={handleLogout}
                  >
                    <span className="profile-action__icon">
                      <LogOut size={18} />
                    </span>
                    <span className="profile-action__label">Log out</span>
                    <ChevronRight size={18} className="profile-action__chevron" />
                  </button>
                </div>
              </section>
            </>
          )}

          {!isLoggedIn && (
            <section className="section" id="profile-access">
              <div className="section__head">
                <h2>Account access</h2>
              </div>
              <div className="surface profile-card">
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
              </div>
            </section>
          )}

        </div>
        <BottomNav active="profile" />
      </main>
    </div>
  );
}
