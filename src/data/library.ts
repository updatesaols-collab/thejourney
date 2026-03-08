import type { LibraryRecord } from "@/lib/types";

type LibrarySeed = Omit<LibraryRecord, "id" | "createdAt" | "updatedAt">;

export const LIBRARY_ITEMS: LibrarySeed[] = [
  {
    kind: "hero",
    title: "Library of calm",
    description:
      "Short reads, soothing practices, and guided reflections to help you feel supported every day.",
    eyebrow: "Daily guidance",
    buttonLabel: "Start with basics",
    order: 0,
  },
  {
    kind: "suggestion",
    title: "Sleep",
    description: "Fall asleep with ease",
    tone: "sleep",
    order: 0,
  },
  {
    kind: "suggestion",
    title: "Anxiety",
    description: "Calm stress and anxious spirals",
    tone: "anxiety",
    order: 1,
  },
  {
    kind: "suggestion",
    title: "Morning energy",
    description: "Wake up with focus and energy",
    tone: "morning",
    order: 2,
  },
  {
    kind: "suggestion",
    title: "Pain relief",
    description: "Soothe tension in the body",
    tone: "relief",
    order: 3,
  },
  {
    kind: "article",
    tag: "Breathwork",
    title: "A beginner's path to steady breath",
    description: "A practical guide to calmer breathing in under five minutes.",
    time: "6 min read",
    order: 0,
  },
  {
    kind: "article",
    tag: "Mindset",
    title: "Resetting the inner dialogue",
    description: "Prompts to soften self-talk and restore perspective.",
    time: "8 min read",
    order: 1,
  },
  {
    kind: "article",
    tag: "Routine",
    title: "Evening ritual for deeper sleep",
    description: "A gentle 3-step ritual to transition into rest.",
    time: "5 min read",
    order: 2,
  },
  {
    kind: "quick",
    title: "Two-minute grounding check-in",
    description: "",
    time: "2 min",
    order: 0,
  },
  {
    kind: "quick",
    title: "Breath cues for anxious moments",
    description: "",
    time: "3 min",
    order: 1,
  },
  {
    kind: "quick",
    title: "Desk stretch reset",
    description: "",
    time: "4 min",
    order: 2,
  },
  {
    kind: "intent",
    title: "Release stress",
    description: "",
    link: "/library",
    order: 0,
  },
  {
    kind: "intent",
    title: "Learn Sudarshan Kriya",
    description: "",
    link: "/library",
    order: 1,
  },
  {
    kind: "intent",
    title: "Find solution for sleep",
    description: "",
    link: "/library",
    order: 2,
  },
];
