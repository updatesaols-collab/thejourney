import { NextResponse } from "next/server";
import { listCategories } from "@/lib/categories";
import { listFaqs } from "@/lib/faqs";
import { listHeroSlides } from "@/lib/heroSlides";
import { listLibrary } from "@/lib/library";
import { listPrograms } from "@/lib/programs";
import { listReviews } from "@/lib/reviews";

/**
 * Aggregated homepage payload to reduce client round trips.
 * Response is CDN-cacheable for a short window to keep data fresh but fast.
 */
export async function GET() {
  try {
    const [programs, categories, intents, reviews, faqs, heroSlides] = await Promise.all([
      listPrograms({ limit: 4 }),
      listCategories(),
      listLibrary({ kind: "intent" }),
      listReviews({ status: "Published", limit: 12 }),
      listFaqs({ status: "Published", limit: 20 }),
      listHeroSlides({ status: "Active" }),
    ]);

    return NextResponse.json(
      {
        programs,
        categories,
        intents,
        reviews,
        faqs,
        heroSlides,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to load homepage data" },
      { status: 500 }
    );
  }
}
