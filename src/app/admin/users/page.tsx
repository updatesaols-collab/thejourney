"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Pencil } from "lucide-react";
import AdminShell from "../_components/AdminShell";
import type { ProfileRecord, ProfileSettings } from "@/lib/types";
import { downloadCsv } from "../utils";

const TOGGLE_FILTERS = ["All", "On", "Off"] as const;

const defaultSettings: ProfileSettings = {
  emailUpdates: true,
  smsReminders: false,
  weeklyDigest: true,
};

export default function UsersPage() {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [query, setQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("All");
  const [smsFilter, setSmsFilter] = useState("All");
  const [digestFilter, setDigestFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProfileRecord | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const res = await fetch("/api/profiles");
        if (!res.ok) return;
        const data = (await res.json()) as ProfileRecord[];
        setProfiles(data);
      } catch {}
    };

    loadProfiles();
  }, []);

  const normalizedProfiles = useMemo(
    () =>
      profiles.map((profile) => ({
        ...profile,
        settings: profile.settings || defaultSettings,
      })),
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    const term = query.trim().toLowerCase();
    return normalizedProfiles.filter((profile) => {
      const matchesQuery = !term
        ? true
        : [
            profile.fullName,
            profile.email,
            profile.phone,
            profile.userId,
          ]
            .join(" ")
            .toLowerCase()
            .includes(term);

      const matchesEmail =
        emailFilter === "All" ||
        (emailFilter === "On" ? profile.settings.emailUpdates : !profile.settings.emailUpdates);
      const matchesSms =
        smsFilter === "All" ||
        (smsFilter === "On" ? profile.settings.smsReminders : !profile.settings.smsReminders);
      const matchesDigest =
        digestFilter === "All" ||
        (digestFilter === "On" ? profile.settings.weeklyDigest : !profile.settings.weeklyDigest);

      return matchesQuery && matchesEmail && matchesSms && matchesDigest;
    });
  }, [normalizedProfiles, query, emailFilter, smsFilter, digestFilter]);

  const openModal = (profile: ProfileRecord) => {
    setForm({
      ...profile,
      settings: profile.settings || defaultSettings,
    });
    setModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          dob: form.dob,
          settings: form.settings,
        }),
      });
      if (res.ok) {
        const updated = (await res.json()) as ProfileRecord;
        setProfiles((prev) =>
          prev.map((item) => (item.userId === updated.userId ? updated : item))
        );
        setModalOpen(false);
      }
    } catch {}
  };

  const handleExport = () => {
    const rows = filteredProfiles.map((profile) => ({
      userId: profile.userId,
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      dob: profile.dob,
      emailUpdates: profile.settings.emailUpdates ? "On" : "Off",
      smsReminders: profile.settings.smsReminders ? "On" : "Off",
      weeklyDigest: profile.settings.weeklyDigest ? "On" : "Off",
      updatedAt: profile.updatedAt || "",
    }));
    downloadCsv("users.csv", rows, [
      "userId",
      "fullName",
      "email",
      "phone",
      "address",
      "dob",
      "emailUpdates",
      "smsReminders",
      "weeklyDigest",
      "updatedAt",
    ]);
  };

  return (
    <AdminShell
      title="Users"
      subtitle="Captured profiles and preferences"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: "Search by name, email, phone",
      }}
    >
      <section className="admin__toolbar">
        <div className="admin__filters">
          <div className="admin__field">
            Email updates
            <select
              value={emailFilter}
              onChange={(event) => setEmailFilter(event.target.value)}
            >
              {TOGGLE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="admin__field">
            SMS reminders
            <select
              value={smsFilter}
              onChange={(event) => setSmsFilter(event.target.value)}
            >
              {TOGGLE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="admin__field">
            Weekly digest
            <select
              value={digestFilter}
              onChange={(event) => setDigestFilter(event.target.value)}
            >
              {TOGGLE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin__toolbar-actions">
          <button className="admin__button light" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
        </div>
      </section>

      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2>Profiles</h2>
            <p>{filteredProfiles.length} users</p>
          </div>
        </div>
        <table className="admin__table">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Settings</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredProfiles.map((profile) => (
              <tr key={profile.userId}>
                <td>
                  <strong>{profile.fullName || "Seeker"}</strong>
                  <span>{profile.email || profile.userId}</span>
                </td>
                <td>{profile.phone || "—"}</td>
                <td>
                  <div className="admin__badge-row">
                    <span
                      className={`badge ${
                        profile.settings.emailUpdates ? "badge--on" : "badge--off"
                      }`}
                    >
                      Email
                    </span>
                    <span
                      className={`badge ${
                        profile.settings.smsReminders ? "badge--on" : "badge--off"
                      }`}
                    >
                      SMS
                    </span>
                    <span
                      className={`badge ${
                        profile.settings.weeklyDigest ? "badge--on" : "badge--off"
                      }`}
                    >
                      Digest
                    </span>
                  </div>
                </td>
                <td>
                  {profile.updatedAt
                    ? new Date(profile.updatedAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="admin__table-actions">
                  <button
                    className="admin__icon"
                    onClick={() => openModal(profile)}
                    aria-label="Edit profile"
                  >
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {modalOpen && form && (
        <div className="admin-modal">
          <div
            className="admin-modal__backdrop"
            onClick={() => setModalOpen(false)}
          />
          <div className="admin-modal__content">
            <div className="admin-modal__header">
              <h3>Edit profile</h3>
              <button className="admin__icon" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="admin-modal__form">
              <label>
                User ID
                <input value={form.userId} readOnly />
              </label>
              <label>
                Full name
                <input
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </label>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </label>
              <label>
                Address
                <input
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                />
              </label>
              <label>
                Date of birth
                <input
                  type="date"
                  value={form.dob}
                  onChange={(event) => setForm({ ...form, dob: event.target.value })}
                />
              </label>
              <label className="admin__toggle">
                <input
                  type="checkbox"
                  checked={form.settings.emailUpdates}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      settings: {
                        ...form.settings,
                        emailUpdates: event.target.checked,
                      },
                    })
                  }
                />
                Email updates
              </label>
              <label className="admin__toggle">
                <input
                  type="checkbox"
                  checked={form.settings.smsReminders}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      settings: {
                        ...form.settings,
                        smsReminders: event.target.checked,
                      },
                    })
                  }
                />
                SMS reminders
              </label>
              <label className="admin__toggle">
                <input
                  type="checkbox"
                  checked={form.settings.weeklyDigest}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      settings: {
                        ...form.settings,
                        weeklyDigest: event.target.checked,
                      },
                    })
                  }
                />
                Weekly digest
              </label>
              <button className="admin__button" type="submit">
                Save changes
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
