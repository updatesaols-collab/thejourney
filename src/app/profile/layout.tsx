import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "User account and profile settings for Journey.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
