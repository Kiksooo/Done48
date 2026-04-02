import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CabinetBreadcrumb = { label: string; href?: string };

type Props = {
  title: string;
  description?: ReactNode;
  breadcrumbs?: CabinetBreadcrumb[];
  action?: ReactNode;
  className?: string;
};

/**
 * Верх страницы кабинета: «крошки», заголовок и опциональное действие справа.
 */
export function CabinetPageHeader({ title, description, breadcrumbs, action, className }: Props) {
  return (
    <div
      className={cn(
        "relative mb-8 overflow-hidden rounded-2xl border border-border/80 bg-card p-6 shadow-sm backdrop-blur-sm dark:bg-card/80 sm:p-7",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-foreground/12 before:to-transparent",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute right-5 top-4 flex gap-1.5 sm:right-6 sm:top-5"
        aria-hidden
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary/35" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/20" />
        <span className="h-1.5 w-1.5 rounded-full bg-foreground/10" />
      </div>
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full border border-dashed border-primary/[0.12] opacity-60 dark:border-primary/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-4 top-1/2 h-16 w-16 -translate-y-1/2 rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.04] to-transparent dark:from-primary/[0.07]"
        aria-hidden
      />
      {breadcrumbs?.length ? (
        <nav className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground" aria-label="Навигация">
          {breadcrumbs.map((b, i) => (
            <span key={`${b.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden /> : null}
              {b.href ? (
                <Link href={b.href} className="transition-colors hover:text-foreground">
                  {b.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground/90">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {description != null && description !== "" ? (
            <div className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </div>
          ) : null}
        </div>
        {action ? <div className="shrink-0 sm:pt-0.5">{action}</div> : null}
      </div>
    </div>
  );
}
