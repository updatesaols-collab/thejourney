"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, ChevronLeft, MapPin, SlidersHorizontal } from "lucide-react";
import type { NotificationRecord } from "@/lib/types";

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
  const label = subtitle ?? (showBack ? "Journey" : "Your journey");
  const detailLabel = "Journey - The Art of Living";
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem("journey_notifications_read");
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as string[];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  });
  const readSet = useMemo(() => new Set(readIds), [readIds]);

  useEffect(() => {
    let isActive = true;
    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?status=Active&limit=5");
        if (!res.ok) return;
        const data = (await res.json()) as NotificationRecord[];
        if (isActive) setNotifications(data);
      } catch {}
    };
    loadNotifications();
    return () => {
      isActive = false;
    };
  }, []);

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "journey_notifications_read",
          JSON.stringify(next)
        );
      }
      return next;
    });
  };

  const unreadCount = notifications.filter((item) => !readSet.has(item.id)).length;
  const hasNotifications = unreadCount > 0;
  const formattedNotifications = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        dateLabel: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "",
      })),
    [notifications]
  );

  const backAction = showBack ? (
    backHref ? (
      <Link className="icon-button icon-button--soft" href={backHref} aria-label="Go back">
        <ChevronLeft size={18} />
      </Link>
    ) : (
      <button
        className="icon-button icon-button--soft"
        type="button"
        onClick={handleBack}
        aria-label="Go back"
      >
        <ChevronLeft size={18} />
      </button>
    )
  ) : null;

  return (
    <header className={`home-header ${showBack ? "home-header--detail" : ""}`}>
      <div className={`location ${showBack ? "location--detail" : ""}`}>
        {showBack ? (
          <>
            <div className="location__backline">
              {backAction}
              <div className="location__meta">
                <span className="location__tag">{title}</span>
                <span className="location__label-soft">{detailLabel}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <span className="location__label">
              <MapPin size={14} />
              {label}
            </span>
            <button className="location__value" type="button">
              {title}
              {variant === "home" && <ChevronDown size={16} />}
            </button>
          </>
        )}
      </div>
      <div className="icon-row">
        {variant === "explore" ? (
          <button className="icon-button icon-button--soft" aria-label="Filters">
            <SlidersHorizontal size={18} />
          </button>
        ) : (
          <div className="notification-wrap">
            <button
              className={`icon-button icon-button--soft ${
                hasNotifications ? "icon-button--notify" : ""
              }`}
              aria-label="Notifications"
              onClick={() => setOpenNotifications((prev) => !prev)}
              type="button"
            >
              <Bell size={18} />
            </button>
            {openNotifications && (
              <div className="notification-menu surface">
                <p className="notification-menu__title">Notifications</p>
                {formattedNotifications.length === 0 ? (
                  <p className="notification-menu__empty">No notifications yet.</p>
                ) : (
                  formattedNotifications.map((item) => {
                    const content = (
                      <div className="notification-item">
                        <div>
                          <p className="notification-item__title">{item.title}</p>
                          <p className="notification-item__message">{item.message}</p>
                        </div>
                        {item.dateLabel && (
                          <span className="notification-item__date">
                            {item.dateLabel}
                          </span>
                        )}
                      </div>
                    );
                    return item.link ? (
                      <Link
                        key={item.id}
                        href={item.link}
                        className="notification-item__link"
                        onClick={() => {
                          markAsRead(item.id);
                          setOpenNotifications(false);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        key={item.id}
                        className="notification-item__link"
                        type="button"
                        onClick={() => {
                          markAsRead(item.id);
                          setOpenNotifications(false);
                        }}
                      >
                        {content}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
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
