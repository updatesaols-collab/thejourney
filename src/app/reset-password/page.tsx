"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/TopBar";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    if (!token) {
      setStatus("Reset link is missing or invalid.");
      return;
    }
    if (!password || !confirm) {
      setStatus("Enter and confirm your new password.");
      return;
    }
    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "" }));
        setStatus(data.message || "Unable to reset password.");
        return;
      }
      setStatus("Password updated. You can now log in.");
      setTimeout(() => router.push("/profile"), 1200);
    } catch {
      setStatus("Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <main className="phone">
        <div className="content">
          <TopBar title="Reset password" showBack backHref="/profile" />
          <section className="surface profile-card">
            <div>
              <p className="list-title">Choose a new password</p>
              <p className="list-meta">
                Set a new password to regain access to your account.
              </p>
            </div>
            <form className="profile-form" onSubmit={handleSubmit}>
              <label>
                New password
                <input
                  className="text-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Confirm password
                <input
                  className="text-input"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <button className="button button--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Reset password"}
              </button>
              {status && <p className="list-meta">{status}</p>}
            </form>
            {!token && (
              <p className="list-meta">
                Need a new link? Request one from{" "}
                <Link className="link" href="/profile">
                  Profile
                </Link>
                .
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
