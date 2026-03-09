"use client";

export const getOrCreateUserId = () => {
  if (typeof window === "undefined") return "server-user";
  let sessionRaw: string | null = null;
  try {
    sessionRaw = localStorage.getItem("journey_auth_session");
  } catch {
    sessionRaw = null;
  }
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw) as { email?: string };
      if (session?.email && session.email.trim()) {
        return session.email.trim().toLowerCase();
      }
    } catch {}
  }
  const key = "journey_user_id";
  let existing: string | null = null;
  try {
    existing = localStorage.getItem(key);
  } catch {
    existing = null;
  }
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `user-${Math.random().toString(36).slice(2, 10)}`;
  try {
    localStorage.setItem(key, generated);
  } catch {
    // Ignore blocked storage writes and use the generated value in memory.
  }
  return generated;
};
