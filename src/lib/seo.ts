const DEFAULT_SITE_URL = "http://localhost:3000";

export const SEO_BRAND_NAME = "Journey - The Art of Living Nepal";
export const SEO_ORGANIZATION_NAME = "Art of Living Nepal";
export const SEO_ADDRESS = "Art of Living Nepal, Shankhamul Kathmandu";
export const SEO_EMAIL = "updates.aols@gmail.com";
export const SEO_PHONE = "+9779810553757";
export const SEO_WHATSAPP_URL = "https://wa.me/9779810553757";

export const getSiteUrl = () => {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    DEFAULT_SITE_URL;

  try {
    return new URL(raw).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
};

export const absoluteUrl = (path = "/") => new URL(path, getSiteUrl()).toString();
