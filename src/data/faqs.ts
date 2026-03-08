import type { FaqRecord } from "@/lib/types";

type FaqSeed = Omit<FaqRecord, "id" | "createdAt" | "updatedAt">;

export const FAQS: FaqSeed[] = [
  {
    question: "Who can join these programs?",
    answer:
      "Anyone above 18 can join most programs. If a course has a specific age or health requirement, it will be clearly mentioned on that program page.",
    category: "General",
    order: 0,
    status: "Published",
  },
  {
    question: "Do I need prior meditation or yoga experience?",
    answer:
      "No prior experience is required. Sessions are guided for beginners and also useful for regular practitioners.",
    category: "Programs",
    order: 1,
    status: "Published",
  },
  {
    question: "How do I register for a session in Kathmandu?",
    answer:
      "Open the program details page, click Register now, and submit your details. You will receive confirmation and follow-up instructions.",
    category: "Registration",
    order: 2,
    status: "Published",
  },
];
