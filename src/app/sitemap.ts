import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { listPublicExecutorUsernames } from "@/server/queries/public-executor";
import { listBlogSlugs } from "@/server/queries/blog";

/** Публичные URL для индексации (кабинеты и API закрыты в robots.txt). */
const PATHS = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/executors", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/login", changeFrequency: "monthly", priority: 0.6 },
  { path: "/register", changeFrequency: "monthly", priority: 0.8 },
  { path: "/forgot-password", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal", changeFrequency: "monthly", priority: 0.5 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.4 },
] as const;

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

  const [executors, blogPosts] = await Promise.all([
    listPublicExecutorUsernames(),
    listBlogSlugs(),
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

  return [...fixed, ...executorUrls, ...blogUrls] as MetadataRoute.Sitemap;
}
