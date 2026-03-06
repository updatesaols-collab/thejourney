import Link from "next/link";
import { BookOpen, Compass, Home as HomeIcon, Sparkles, User } from "lucide-react";

type BottomNavProps = {
  active: "home" | "explore" | "library" | "rituals" | "profile";
};

export default function BottomNav({ active }: BottomNavProps) {
  const tabs = [
    { id: "home", label: "Home", href: "/", icon: HomeIcon },
    { id: "explore", label: "Explore", href: "/explore", icon: Compass },
    { id: "library", label: "Library", href: "/library", icon: BookOpen },
    { id: "rituals", label: "Rituals", href: "/rituals", icon: Sparkles },
    { id: "profile", label: "Profile", href: "/profile", icon: User },
  ] as const;

  return (
    <nav className="tabbar" aria-label="Primary">
      <div className="tabbar__inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              className={`tab ${active === tab.id ? "tab--active" : ""}`}
              href={tab.href}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
