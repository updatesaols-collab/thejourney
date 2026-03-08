import type { HeroSlideRecord } from "@/lib/types";

type HeroSlideSeed = Omit<HeroSlideRecord, "id" | "createdAt" | "updatedAt">;

export const HERO_SLIDES: HeroSlideSeed[] = [];
