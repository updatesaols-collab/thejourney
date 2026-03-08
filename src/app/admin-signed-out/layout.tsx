import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Sign in page for Journey admin access.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSignedOutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
