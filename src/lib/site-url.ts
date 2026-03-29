/**
 * Канонический origin сайта: SEO (sitemap, metadataBase), OG, JSON-LD, письма.
 * В проде задайте NEXT_PUBLIC_SITE_URL=https://ваш-домен.ru (предпочтительно).
 */
export function getSiteUrl(): string {
  const pub = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (pub) return pub.replace(/\/$/, "");
  const auth = process.env.NEXTAUTH_URL?.trim();
  if (auth) return auth.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

/** @deprecated Используйте getSiteUrl; оставлено для совместимости импортов. */
export function appBaseUrl(): string {
  return getSiteUrl();
}
