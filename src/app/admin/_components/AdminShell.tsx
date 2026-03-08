"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

type SearchConfig = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type AdminShellProps = {
  title: string;
  subtitle?: string;
  search?: SearchConfig;
  children: React.ReactNode;
};

type AdminProfile = {
  fullName: string;
  role: string;
  email: string;
};

const ADMIN_PROFILE_STORAGE_KEY = "journey_admin_profile";
const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  fullName: "Admin",
  role: "Operations",
  email: "",
};

export default function AdminShell({
  title,
  subtitle,
  search,
  children,
}: AdminShellProps) {
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(DEFAULT_ADMIN_PROFILE);

  useEffect(() => {
    const loadProfile = () => {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
      if (!stored) {
        setAdminProfile(DEFAULT_ADMIN_PROFILE);
        return;
      }
      try {
        const parsed = JSON.parse(stored) as Partial<AdminProfile>;
        setAdminProfile({
          fullName: parsed.fullName?.trim() || DEFAULT_ADMIN_PROFILE.fullName,
          role: parsed.role?.trim() || DEFAULT_ADMIN_PROFILE.role,
          email: parsed.email?.trim() || "",
        });
      } catch {
        setAdminProfile(DEFAULT_ADMIN_PROFILE);
      }
    };

    loadProfile();
    window.addEventListener("storage", loadProfile);
    window.addEventListener("admin-profile-updated", loadProfile);
    return () => {
      window.removeEventListener("storage", loadProfile);
      window.removeEventListener("admin-profile-updated", loadProfile);
    };
  }, []);

  const initials = useMemo(() => {
    const parts = adminProfile.fullName
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return "AD";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [adminProfile.fullName]);

  return (
    <div className="admin">
      <AdminSidebar />
      <div className="admin__main">
        <header className="admin__topbar">
          <div className="admin__headline">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {search && (
            <div className="admin__search">
              <Search size={16} />
              <input
                placeholder={search.placeholder ?? "Search"}
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
              />
            </div>
          )}
          <div className="admin__actions">
            <Link className="admin__user admin__user-link" href="/admin/settings">
              <div className="admin__avatar">{initials}</div>
              <div>
                <p>{adminProfile.fullName}</p>
                <span>{adminProfile.role || "Profile & Settings"}</span>
              </div>
            </Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
