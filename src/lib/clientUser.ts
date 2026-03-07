"use client";

export const getOrCreateUserId = () => {
  if (typeof window === "undefined") return "server-user";
  const sessionRaw = localStorage.getItem("journey_auth_session");
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw) as { email?: string };
      if (session?.email && session.email.trim()) {
        return session.email.trim().toLowerCase();
      }
    } catch {}
  }
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
