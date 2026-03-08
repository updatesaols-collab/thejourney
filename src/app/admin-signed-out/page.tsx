"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import styles from "./page.module.scss";

export default function AdminSignedOutPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "admin",
    password: "",
  });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [status, setStatus] = useState("");

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSigningIn) return;
    setIsSigningIn(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({ message: "" }))) as {
          message?: string;
        };
        setStatus(data.message || "Unable to sign in.");
        setIsSigningIn(false);
        return;
      }
    } catch {
      setStatus("Unable to sign in.");
      setIsSigningIn(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className={`page ${styles.page}`}>
      <main className="phone">
        <div className={`content ${styles.content}`}>
          <section className={`section ${styles.section}`}>
            <div className={`surface ${styles.card}`}>
              <div className={styles.badge} aria-hidden="true">
                <ShieldCheck size={18} />
                <span>Admin Access</span>
              </div>
              <h1>Admin signed out</h1>
              <p className={`list-meta ${styles.subtitle}`}>
                You have been logged out successfully. Sign in to continue.
              </p>

              <form className={`profile-form ${styles.form}`} onSubmit={handleSignIn}>
                <label>
                  Username
                  <input
                    className="text-input"
                    value={form.username}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    autoComplete="username"
                  />
                </label>
                <label>
                  Password
                  <input
                    className="text-input"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    autoComplete="current-password"
                  />
                </label>
                <button className={`button button--primary ${styles.submit}`} type="submit" disabled={isSigningIn}>
                  {isSigningIn ? "Signing in..." : "Sign in"}
                </button>
                {status && <p className={`list-meta ${styles.status}`}>{status}</p>}
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
