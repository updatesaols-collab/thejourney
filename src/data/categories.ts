import type { CategoryRecord } from "@/lib/types";

type CategorySeed = Omit<CategoryRecord, "id" | "createdAt" | "updatedAt">;

export const CATEGORIES: CategorySeed[] = [
  { title: "Breathwork", tag: "Breathwork", imageUrl: "", iconName: "Wind", order: 0 },
  {
    title: "Meditation",
    tag: "Meditation",
    imageUrl: "",
    iconName: "Sparkles",
    order: 1,
  },
  { title: "Yoga", tag: "Yoga", imageUrl: "", iconName: "Heart", order: 2 },
  { title: "Sound", tag: "Sound", imageUrl: "", iconName: "Music", order: 3 },
  { title: "Retreat", tag: "Retreat", imageUrl: "", iconName: "Leaf", order: 4 },
];
