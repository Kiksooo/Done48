import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toAbsoluteSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = { label: string; href: string };

type Props = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * Хлебные крошки для публичных страниц. У каждого пункта есть `href`; у последнего —
 * URL текущей страницы (визуально без ссылки, для доступности и JSON-LD).
 */
export function PublicBreadcrumbs({ items, className }: Props) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Хлебные крошки" className={cn("text-sm text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.href}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden /> : null}
              {isLast ? (
                <span
                  className="max-w-[min(20rem,85vw)] truncate font-medium text-foreground"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** JSON-LD BreadcrumbList для Google и Яндекса. */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: toAbsoluteSiteUrl(item.href),
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
