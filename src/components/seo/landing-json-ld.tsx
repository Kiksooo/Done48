import { SITE_EMAIL_INFO } from "@/lib/site-contact";
import {
  SITE_SEO_DESCRIPTION,
  SITE_SEO_JSON_LD_ALTERNATE_NAMES,
  SITE_SEO_KEYWORDS_STRING,
} from "@/lib/site-seo";
import { getSiteUrl } from "@/lib/site-url";

/** Структурированные данные для главной (лендинг): WebSite + Organization + поиск по каталогу. */
export function LandingJsonLd() {
  const base = getSiteUrl();
  const origin = base.endsWith("/") ? base.slice(0, -1) : base;
  const logoUrl = `${origin}/icon`;
  const idOrg = `${base}/#organization`;
  const idWeb = `${base}/#website`;
  const executorsSearchTemplate = `${origin}/executors?q={search_term_string}`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": idWeb,
        url: base.endsWith("/") ? base : `${base}/`,
        name: "DONE48",
        alternateName: SITE_SEO_JSON_LD_ALTERNATE_NAMES,
        description: SITE_SEO_DESCRIPTION,
        keywords: SITE_SEO_KEYWORDS_STRING,
        inLanguage: "ru-RU",
        publisher: { "@id": idOrg },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: executorsSearchTemplate,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": idOrg,
        name: "DONE48",
        alternateName: SITE_SEO_JSON_LD_ALTERNATE_NAMES,
        url: base.endsWith("/") ? base : `${base}/`,
        logo: logoUrl,
        description: SITE_SEO_DESCRIPTION,
        keywords: SITE_SEO_KEYWORDS_STRING,
        email: SITE_EMAIL_INFO,
        areaServed: "RU",
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: SITE_EMAIL_INFO,
            contactType: "customer support",
            availableLanguage: ["ru"],
          },
        ],
      },
    ],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
