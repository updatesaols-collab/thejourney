import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./admin.scss";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Journey Admin",
  description: "Administrative dashboard for Journey - The Art of Living",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={dmSans.className}>{children}</div>;
}
