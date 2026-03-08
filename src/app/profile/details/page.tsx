"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { useStoredAuthSession } from "@/lib/clientAuth";

export default function ProfileDetailsPage() {
  const authSession = useStoredAuthSession();
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
    phone: "",
    address: "",
    dob: "",
  });
  const [status, setStatus] = useState("");
  const isLoggedIn = Boolean(authSession?.email);

  useEffect(() => {
    if (!authSession?.email) return;
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
      } catch {}
    };
    loadProfile();
  }, [authSession?.email]);

  const handleSave = async () => {
    if (!isLoggedIn) return;
    const trimmed = profile.fullName.trim();
    const payload = {
      ...profile,
      fullName: trimmed,
      email: authSession?.email || profile.email,
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (trimmed) {
          localStorage.setItem("journey_profile_name", trimmed);
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

  return (
    <div className="page profile-page">
      <main className="phone">
        <div className="content">
          <TopBar title="Personal details" showBack backHref="/profile" />
          {status && <div className="status-pill surface">{status}</div>}

          {!isLoggedIn ? (
            <section className="section">
              <div className="surface profile-card">
                <p className="list-title">Log in required</p>
                <p className="list-meta">
                  Please log in to update your personal details.
                </p>
                <Link className="button button--primary" href="/profile">
                  Go to Profile
                </Link>
              </div>
            </section>
          ) : (
            <section className="section">
              <div className="surface profile-card">
                <div className="profile-header">
                  <div>
                    <p className="list-title">Profile information</p>
                    <p className="list-meta">Keep your details up to date.</p>
                  </div>
                  <button className="button button--primary" onClick={handleSave}>
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
                      value={authSession?.email || profile.email}
                      placeholder="Enter your email"
                      type="email"
                      disabled
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
          )}
        </div>
        <BottomNav active="profile" />
      </main>
    </div>
  );
}
