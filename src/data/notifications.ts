import type { NotificationRecord } from "@/lib/types";

type NotificationSeed = Omit<NotificationRecord, "id" | "createdAt" | "updatedAt">;

export const NOTIFICATIONS: NotificationSeed[] = [
  {
    title: "New programs are live",
    message: "Check out fresh sessions added for this month.",
    link: "/explore",
    status: "Active",
  },
  {
    title: "Library update",
    message: "New readings and quick practices are available now.",
    link: "/library",
    status: "Active",
  },
];
