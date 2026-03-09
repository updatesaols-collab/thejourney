"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateUserId } from "@/lib/clientUser";
import type { InteractionEventType } from "@/lib/types";

type InteractionPayload = {
  type: InteractionEventType;
  path: string;
  label?: string;
  target?: string;
  userId: string;
  sessionId: string;
};

const TRACK_ENDPOINT = "/api/analytics/events";
const SESSION_STORAGE_KEY = "journey_interaction_session";

const normalizeText = (value: string | null | undefined, maxLength: number) => {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
};

const createSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Math.random().toString(36).slice(2, 10)}`;
};

const readSessionStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeSessionStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore blocked storage writes.
  }
};

const getOrCreateSessionId = () => {
  const existing = readSessionStorage(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const created = createSessionId();
  writeSessionStorage(SESSION_STORAGE_KEY, created);
  return created;
};

const isAdminRoute = (path: string) => path.startsWith("/admin");

const buildPathWithQuery = () => {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search || ""}`;
};

const getNodeLabel = (node: HTMLElement) => {
  const directLabel =
    node.getAttribute("data-analytics-label") ||
    node.getAttribute("aria-label") ||
    node.getAttribute("title");
  if (directLabel) return normalizeText(directLabel, 160);

  const text = normalizeText(node.textContent, 160);
  if (text) return text;

  if (node instanceof HTMLInputElement) {
    return normalizeText(node.value || node.placeholder || node.name, 160);
  }

  return normalizeText(node.tagName.toLowerCase(), 160);
};

const sendInteraction = (payload: InteractionPayload) => {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(TRACK_ENDPOINT, blob);
      if (sent) return;
    }

    void fetch(TRACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Silently skip analytics transport errors.
    });
  } catch {
    // Never let analytics break app rendering.
  }
};

export default function InteractionTracker() {
  const pathname = usePathname();
  const dedupeRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!pathname || isAdminRoute(pathname)) return;
    const payload: InteractionPayload = {
      type: "page_view",
      path: buildPathWithQuery(),
      userId: getOrCreateUserId(),
      sessionId: getOrCreateSessionId(),
    };
    sendInteraction(payload);
  }, [pathname]);

  useEffect(() => {
    if (!pathname || isAdminRoute(pathname)) return;

    const shouldSkip = (key: string) => {
      const now = Date.now();
      const recentAt = dedupeRef.current.get(key) || 0;
      if (now - recentAt < 900) {
        return true;
      }
      dedupeRef.current.set(key, now);
      return false;
    };

    const emit = (type: InteractionEventType, label: string, target?: string) => {
      const path = buildPathWithQuery();
      if (isAdminRoute(path)) return;
      const normalizedLabel = normalizeText(label, 160);
      const normalizedTarget = normalizeText(target, 320);
      const dedupeKey = `${type}:${path}:${normalizedLabel}:${normalizedTarget}`;
      if (shouldSkip(dedupeKey)) return;

      sendInteraction({
        type,
        path,
        label: normalizedLabel,
        target: normalizedTarget,
        userId: getOrCreateUserId(),
        sessionId: getOrCreateSessionId(),
      });
    };

    const handleClick = (event: MouseEvent) => {
      const eventNode = event.target;
      if (!(eventNode instanceof Element)) return;
      const clickable = eventNode.closest(
        'a,button,[role="button"],input[type="submit"],input[type="button"]'
      ) as HTMLElement | null;
      if (!clickable || clickable.getAttribute("data-analytics") === "off") return;

      const label = getNodeLabel(clickable);
      let interactionTarget = "";
      if (clickable instanceof HTMLAnchorElement) {
        interactionTarget = clickable.getAttribute("href") || clickable.href;
      } else {
        interactionTarget =
          clickable.getAttribute("data-track-target") ||
          clickable.getAttribute("name") ||
          clickable.id ||
          clickable.tagName.toLowerCase();
      }

      emit("click", label, interactionTarget);
    };

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null;
      if (!form || form.getAttribute("data-analytics") === "off") return;
      const label =
        normalizeText(form.getAttribute("data-analytics-label"), 160) ||
        normalizeText(form.getAttribute("name"), 160) ||
        normalizeText(form.id, 160) ||
        "form";
      const target = normalizeText(form.getAttribute("action"), 320) || pathname;
      emit("form_submit", label, target);
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [pathname]);

  return null;
}
