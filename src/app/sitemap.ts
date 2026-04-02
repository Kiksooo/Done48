import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { listPublicExecutorUsernames } from "@/server/queries/public-executor";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[0]["changeFrequency"]>;

/** Публичные URL для индексации (кабинеты и API закрыты в robots.txt). */
const PATHS: { path: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/executors", changeFrequency: "weekly", priority: 0.7 },
  { path: "/login", changeFrequency: "monthly", priority: 0.6 },
  { path: "/register", changeFrequency: "monthly", priority: 0.8 },
  { path: "/forgot-password", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal", changeFrequency: "monthly", priority: 0.5 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const origin = base.endsWith("/") ? base.slice(0, -1) : base;
  const now = new Date();

  const fixed = PATHS.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${origin}/` : `${origin}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const executors = await listPublicExecutorUsernames();
  const dynamic = executors
    .map((r) => r.executorProfile?.username)
    .filter(Boolean)
    .map((username) => ({
      url: `${origin}/u/${username}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  return [...fixed, ...dynamic];
}
