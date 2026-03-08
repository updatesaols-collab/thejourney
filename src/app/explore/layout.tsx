import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Programs in Kathmandu",
  description:
    "Browse meditation, yoga, spirituality, wellness and Ayurveda sessions from Journey - The Art of Living Nepal.",
  alternates: {
    canonical: "/explore",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
