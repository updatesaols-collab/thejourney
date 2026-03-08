"use client";

import { useSyncExternalStore } from "react";

export type AuthSession = {
  email: string;
  loggedInAt: string;
};

const AUTH_SESSION_KEY = "journey_auth_session";
const AUTH_SESSION_EVENT = "journey-auth-session-change";
const SERVER_SNAPSHOT: AuthSession | null = null;

let cachedRaw: string | null | undefined;
let cachedSnapshot: AuthSession | null = null;

const parseSnapshot = (stored: string | null): AuthSession | null => {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as AuthSession;
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
};

export const readStoredAuthSession = (): AuthSession | null => {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (stored === cachedRaw) return cachedSnapshot;
  cachedRaw = stored;
  cachedSnapshot = parseSnapshot(stored);
  return cachedSnapshot;
};

export const AUTH_STORAGE_KEY = AUTH_SESSION_KEY;

const emitSessionChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
};

export const setStoredAuthSession = (session: AuthSession) => {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(session);
  window.localStorage.setItem(AUTH_SESSION_KEY, serialized);
  cachedRaw = serialized;
  cachedSnapshot = session;
  emitSessionChange();
};

export const clearStoredAuthSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_SESSION_KEY);
  cachedRaw = null;
  cachedSnapshot = null;
  emitSessionChange();
};

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(AUTH_SESSION_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(AUTH_SESSION_EVENT, onStoreChange);
  };
};

export const useStoredAuthSession = () =>
  useSyncExternalStore(subscribe, readStoredAuthSession, () => SERVER_SNAPSHOT);
