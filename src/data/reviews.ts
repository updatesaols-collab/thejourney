import type { ReviewRecord } from "@/lib/types";

type ReviewSeed = Omit<ReviewRecord, "id" | "createdAt" | "updatedAt">;

export const REVIEWS: ReviewSeed[] = [
  {
    name: "Anisha Shrestha",
    role: "Product Designer",
    location: "Kathmandu",
    rating: 5,
    message:
      "The breathing and meditation sessions helped me reduce stress and sleep better within one week.",
    program: "Happiness Program",
    featured: true,
    order: 0,
    status: "Published",
  },
  {
    name: "Ramesh Adhikari",
    role: "Entrepreneur",
    location: "Lalitpur",
    rating: 5,
    message:
      "Very grounded teachers and practical guidance. The Sudarshan Kriya practice changed my daily routine.",
    program: "Sudarshan Kriya Workshop",
    featured: true,
    order: 1,
    status: "Published",
  },
  {
    name: "Pooja Karki",
    role: "Teacher",
    location: "Bhaktapur",
    rating: 4,
    message:
      "The environment is calm and welcoming. I now feel more focused and emotionally balanced.",
    program: "Meditation Essentials",
    featured: false,
    order: 2,
    status: "Published",
  },
];
