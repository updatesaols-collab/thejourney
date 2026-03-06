"use client";

import { Bell, Search } from "lucide-react";
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

export default function AdminShell({
  title,
  subtitle,
  search,
  children,
}: AdminShellProps) {
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
            <button className="admin__icon" type="button">
              <Bell size={18} />
            </button>
            <div className="admin__user">
              <div className="admin__avatar">JD</div>
              <div>
                <p>Admin</p>
                <span>Operations</span>
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
