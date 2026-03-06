"use client";

export const getOrCreateUserId = () => {
  if (typeof window === "undefined") return "server-user";
  const key = "journey_user_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `user-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, generated);
  return generated;
};
