import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  const origin = base.endsWith("/") ? base.slice(0, -1) : base;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/customer/",
        "/executor/",
        "/onboarding",
        "/orders/",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: new URL(`${origin}/`).host,
  };
}
