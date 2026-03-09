"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChartLine,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  Images,
  MessageSquare,
  Bell,
  Star,
  CircleHelp,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: UserRound },
  { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
  { href: "/admin/categories", label: "Categories", icon: LayoutGrid },
  { href: "/admin/hero-slides", label: "Hero Slides", icon: Images },
  { href: "/admin/programs", label: "Programs", icon: CalendarDays },
  { href: "/admin/library", label: "Library", icon: BookOpen },
  { href: "/admin/rituals", label: "Rituals", icon: Sparkles },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/faqs", label: "FAQs", icon: CircleHelp },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/analytics", label: "Analytics", icon: ChartLine },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin__sidebar">
      <div className="admin__logo">
        <div className="admin__logo-mark">
          <Image
            src="/artofliving.png"
            alt="Art of Living"
            width={120}
            height={42}
            priority
          />
        </div>
        <div>
          <p>Admin Panel</p>
          <span>The Art of Living</span>
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
