/**
 * Канонический origin сайта: SEO (sitemap, metadataBase), OG, JSON-LD, письма.
 * В проде задайте NEXT_PUBLIC_SITE_URL=https://ваш-домен.ru (предпочтительно).
 */
function normalizeUrlInput(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function toValidUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const normalized = normalizeUrlInput(value);
    if (!normalized) return null;
    const parsed = new URL(normalized);
    return parsed.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const pub = toValidUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (pub) return pub;
  const auth = toValidUrl(process.env.NEXTAUTH_URL);
  if (auth) return auth;
  const vercel = toValidUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (vercel) return vercel;
  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  try {
    return new URL(getSiteUrl());
  } catch {
    return new URL("http://localhost:3000");
  }
}

export function getSiteHost(): string {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return "localhost:3000";
  }
}

/** @deprecated Используйте getSiteUrl; оставлено для совместимости импортов. */
export function appBaseUrl(): string {
  return getSiteUrl();
}
