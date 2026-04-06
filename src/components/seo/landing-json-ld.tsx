import { SITE_EMAIL_INFO } from "@/lib/site-contact";
import {
  SITE_SEO_DESCRIPTION,
  SITE_SEO_KEYWORDS_STRING,
  SITE_SEO_ORG_ALTERNATE_NAME,
} from "@/lib/site-seo";
import { getSiteUrl } from "@/lib/site-url";

/** Структурированные данные для главной (лендинг): WebSite + Organization. */
export function LandingJsonLd() {
  const base = getSiteUrl();
  const origin = base.endsWith("/") ? base.slice(0, -1) : base;
  const logoUrl = `${origin}/icon.svg`;
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
        alternateName: SITE_SEO_ORG_ALTERNATE_NAME,
        description: SITE_SEO_DESCRIPTION,
        keywords: SITE_SEO_KEYWORDS_STRING,
        inLanguage: "ru-RU",
        publisher: { "@id": idOrg },
      },
      {
        "@type": "Organization",
        "@id": idOrg,
        name: "DONE48",
        alternateName: SITE_SEO_ORG_ALTERNATE_NAME,
        url: base.endsWith("/") ? base : `${base}/`,
        logo: logoUrl,
        description: SITE_SEO_DESCRIPTION,
        keywords: SITE_SEO_KEYWORDS_STRING,
        email: SITE_EMAIL_INFO,
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
