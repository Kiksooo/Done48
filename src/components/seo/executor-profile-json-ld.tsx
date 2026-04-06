import { getSiteUrl, toAbsoluteSiteUrl } from "@/lib/site-url";

type Props = {
  name: string;
  username: string;
  description?: string | null;
  imageUrl?: string | null;
};

/** Schema.org Person для публичного портфолио специалиста. */
export function ExecutorProfileJsonLd({ name, username, description, imageUrl }: Props) {
  const base = getSiteUrl();
  const origin = base.endsWith("/") ? base.slice(0, -1) : base;
  const profileUrl = `${origin}/u/${encodeURIComponent(username)}`;

  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: profileUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": profileUrl,
    },
  };

  if (description?.trim()) {
    node.description = description.trim().slice(0, 500);
  }
  if (imageUrl?.trim()) {
    node.image = toAbsoluteSiteUrl(imageUrl.trim());
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }} />;
}
