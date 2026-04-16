import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { listPublicExecutorUsernames } from "@/server/queries/public-executor";
import { listBlogSlugs } from "@/server/queries/blog";
import { listPublishedJobVacancySlugs } from "@/server/queries/job-vacancies";

export const dynamic = "force-dynamic";

/** Публичные URL для индексации (кабинеты и API закрыты в robots.txt). */
const PATHS = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/executors", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/vacancies", changeFrequency: "monthly", priority: 0.55 },
  { path: "/legal", changeFrequency: "monthly", priority: 0.5 },
  { path: "/legal/fees", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.4 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const origin = base.endsWith("/") ? base.slice(0, -1) : base;

  const fixed = PATHS.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${origin}/` : `${origin}${path}`,
    changeFrequency,
    priority,
  }));

  const [executors, blogPosts, vacancySlugs] = await Promise.all([
    listPublicExecutorUsernames(),
    listBlogSlugs(),
    listPublishedJobVacancySlugs(),
  ]);

  const executorUrls = executors.flatMap((r) => {
    const username = r.executorProfile?.username;
    if (!username) return [];
    return [
      {
        url: `${origin}/u/${username}`,
        lastModified: r.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ];
  });

  const blogUrls = blogPosts.map((p) => ({
    url: `${origin}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const vacancyUrls = vacancySlugs.map((v) => ({
    url: `${origin}/vacancies/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  return [...fixed, ...executorUrls, ...blogUrls, ...vacancyUrls] as MetadataRoute.Sitemap;
}
