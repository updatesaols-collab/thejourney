"use client";

import BottomNav from "@/components/BottomNav";
import TopBar from "@/components/TopBar";
import { SEO_ADDRESS, SEO_EMAIL, SEO_PHONE, SEO_WHATSAPP_URL } from "@/lib/seo";

export default function ProfileSupportPage() {
  return (
    <div className="page profile-page">
      <main className="phone">
        <div className="content">
          <TopBar title="Contact & support" showBack backHref="/profile" />

          <section className="home-seo-intro surface">
            <p className="home-seo-intro__eyebrow">Journey - The Art of Living Nepal</p>
            <h1>Contact and support</h1>
            <p className="home-seo-intro__text">
              Reach our team for guidance on programs, registrations, and practice support.
            </p>
            <address className="home-seo-intro__contact" aria-label="Contact details">
              <span>{SEO_ADDRESS}</span>
              <a href={`mailto:${SEO_EMAIL}`}>{SEO_EMAIL}</a>
              <a href="tel:+9779810553757">{SEO_PHONE}</a>
              <a href={SEO_WHATSAPP_URL} target="_blank" rel="noreferrer">
                WhatsApp preferred
              </a>
            </address>
          </section>
        </div>
        <BottomNav active="profile" />
      </main>
    </div>
  );
}
