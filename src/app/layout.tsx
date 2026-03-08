import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.scss";
import InteractionTracker from "@/components/InteractionTracker";
import {
  absoluteUrl,
  getSiteUrl,
  SEO_BRAND_NAME,
  SEO_EMAIL,
  SEO_ORGANIZATION_NAME,
  SEO_PHONE,
  SEO_WHATSAPP_URL,
} from "@/lib/seo";

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default:
      "Journey - The Art of Living Nepal | Meditation, Yoga, Spirituality and Wellness",
    template: "%s | Journey - The Art of Living Nepal",
  },
  description:
    "Official Journey - The Art of Living Nepal site for meditation, yoga, spirituality, wellness and Ayurveda programs in Kathmandu.",
  applicationName: SEO_BRAND_NAME,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "best meditation in Kathmandu",
    "meditation Nepal",
    "yoga in Kathmandu",
    "spirituality Nepal",
    "wellness programs Kathmandu",
    "ayurveda Nepal",
    "Sudarshan Kriya Nepal",
    "Art of Living Nepal",
    "Journey The Art of Living",
  ],
  authors: [{ name: SEO_ORGANIZATION_NAME }],
  creator: SEO_ORGANIZATION_NAME,
  publisher: SEO_ORGANIZATION_NAME,
  openGraph: {
    type: "website",
    locale: "en_NP",
    url: "/",
    siteName: SEO_BRAND_NAME,
    title: "Journey - The Art of Living Nepal",
    description:
      "Discover meditation, yoga, breathwork and Ayurveda programs in Kathmandu, Nepal.",
    images: [
      {
        url: "/artofliving.png",
        width: 512,
        height: 512,
        alt: "Journey - The Art of Living Nepal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Journey - The Art of Living Nepal",
    description:
      "Official Art of Living Nepal platform for meditation, yoga, spirituality and wellness.",
    images: ["/artofliving.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "wellness",
  other: {
    "geo.placename": "Kathmandu, Nepal",
    "contact:email": SEO_EMAIL,
    "contact:phone_number": SEO_PHONE,
    "contact:whatsapp": SEO_WHATSAPP_URL,
  },
  icons: {
    icon: "/artofliving.png?v=2",
    shortcut: "/artofliving.png?v=2",
    apple: "/artofliving.png?v=2",
  },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SEO_BRAND_NAME,
  legalName: SEO_ORGANIZATION_NAME,
  url: absoluteUrl("/"),
  logo: absoluteUrl("/artofliving.png"),
  email: SEO_EMAIL,
  telephone: SEO_PHONE,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Shankhamul",
    addressLocality: "Kathmandu",
    addressCountry: "NP",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: SEO_PHONE,
      email: SEO_EMAIL,
      areaServed: "NP",
      availableLanguage: ["en", "ne"],
    },
  ],
  sameAs: [SEO_WHATSAPP_URL],
};

const webSiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SEO_BRAND_NAME,
  url: absoluteUrl("/"),
  inLanguage: "en-NP",
  potentialAction: {
    "@type": "SearchAction",
    target: `${absoluteUrl("/explore")}?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const localBusinessStructuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SEO_BRAND_NAME,
  image: absoluteUrl("/artofliving.png"),
  url: absoluteUrl("/"),
  telephone: SEO_PHONE,
  email: SEO_EMAIL,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Shankhamul",
    addressLocality: "Kathmandu",
    addressCountry: "NP",
  },
  areaServed: {
    "@type": "Country",
    name: "Nepal",
  },
  sameAs: [SEO_WHATSAPP_URL],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = JSON.stringify([
    organizationStructuredData,
    webSiteStructuredData,
    localBusinessStructuredData,
  ]);

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${fraunces.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
        <InteractionTracker />
        {children}
      </body>
    </html>
  );
}
