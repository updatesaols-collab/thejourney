"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell, ChevronLeft, SlidersHorizontal } from "lucide-react";

type TopBarProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  variant?: "home" | "explore";
  backHref?: string;
};

export default function TopBar({
  title,
  subtitle,
  showBack,
  variant = "home",
  backHref,
}: TopBarProps) {
  const router = useRouter();
  const handleBack = () => router.back();

  return (
    <header className="topbar">
      <div className="brand">
        {showBack ? (
          backHref ? (
            <Link className="icon-button" href={backHref} aria-label="Go back">
              <ChevronLeft size={18} />
            </Link>
          ) : (
            <button
              className="icon-button"
              type="button"
              onClick={handleBack}
              aria-label="Go back"
            >
              <ChevronLeft size={18} />
            </button>
          )
        ) : (
          <span className="brand__dot" aria-hidden="true" />
        )}
        <div>
          <p className="brand__label">{subtitle ?? "Journey"}</p>
          <p className="brand__title">{title}</p>
        </div>
      </div>
      <div className="icon-row">
        {variant === "explore" ? (
          <button className="icon-button" aria-label="Filters">
            <SlidersHorizontal size={18} />
          </button>
        ) : (
          <>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
          </>
        )}
        <span className="topbar__logo" aria-hidden="true">
          <Image
            src="/artofliving.png"
            alt="Art of Living logo"
            width={36}
            height={36}
            priority
          />
        </span>
      </div>
    </header>
  );
}
