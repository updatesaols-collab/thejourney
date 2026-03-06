"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartLine,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Settings,
  UserRound,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: UserRound },
  { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admin/programs", label: "Programs", icon: CalendarDays },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: ChartLine },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin__sidebar">
      <div className="admin__logo">
        <div className="admin__logo-mark">J</div>
        <div>
          <p>Journey Admin</p>
          <span>Art of Living</span>
        </div>
      </div>

      <nav className="admin__nav">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "active" : ""}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
