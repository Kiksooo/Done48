/**
 * Канонический origin сайта: SEO (sitemap, metadataBase), OG, JSON-LD, письма.
 * В проде задайте NEXT_PUBLIC_SITE_URL=https://ваш-домен.ru (предпочтительно).
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (LOCAL_HOSTS.has(h)) return true;
  return h.endsWith(".local");
}

/** Вне localhost всегда https — даже если в env ошибочно указан http:// (письма, OG, sitemap). */
function enforceHttpsOutsideLocal(origin: string): string {
  try {
    const u = new URL(origin);
    if (isLocalHostname(u.hostname)) return origin;
    if (u.protocol === "http:") {
      u.protocol = "https:";
      return u.origin;
    }
    return origin;
  } catch {
    return origin;
  }
}

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
  if (pub) return enforceHttpsOutsideLocal(pub);
  const auth = toValidUrl(process.env.NEXTAUTH_URL);
  if (auth) return enforceHttpsOutsideLocal(auth);
  const vercel = toValidUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (vercel) return enforceHttpsOutsideLocal(vercel);
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

/** Абсолютный URL для OG/изображений: уже с протоколом — как есть, иначе дополняем origin сайта. */
export function toAbsoluteSiteUrl(pathOrUrl: string): string {
  const t = pathOrUrl.trim();
  if (!t) return getSiteUrl();
  if (/^https?:\/\//i.test(t)) return t;
  const base = getSiteUrl().replace(/\/$/, "");
  const path = t.startsWith("/") ? t : `/${t}`;
  return `${base}${path}`;
}

/** @deprecated Используйте getSiteUrl; оставлено для совместимости импортов. */
export function appBaseUrl(): string {
  return getSiteUrl();
}
