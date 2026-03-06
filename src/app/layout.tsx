import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.scss";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Journey - The Art of Living",
  description:
    "Journey is a modern ritual space for calm, breathwork, and daily presence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        {children}
      </body>
    </html>
  );
}
