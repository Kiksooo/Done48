import { SITE_EMAIL_INFO } from "@/lib/site-contact";
import { SITE_SEO_DESCRIPTION } from "@/lib/site-seo";
import { getSiteUrl } from "@/lib/site-url";

/** Структурированные данные для главной (лендинг): WebSite + Organization. */
export function LandingJsonLd() {
  const base = getSiteUrl();
  const idOrg = `${base}/#organization`;
  const idWeb = `${base}/#website`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": idWeb,
        url: base.endsWith("/") ? base : `${base}/`,
        name: "DONE48",
        description: SITE_SEO_DESCRIPTION,
        inLanguage: "ru-RU",
        publisher: { "@id": idOrg },
      },
      {
        "@type": "Organization",
        "@id": idOrg,
        name: "DONE48",
        url: base.endsWith("/") ? base : `${base}/`,
        description: SITE_SEO_DESCRIPTION,
        email: SITE_EMAIL_INFO,
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
