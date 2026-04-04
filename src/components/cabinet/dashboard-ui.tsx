import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardWelcome({
  greeting,
  subtitle,
  action,
}: {
  greeting: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/80 bg-card px-5 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl dark:bg-primary/10"
        aria-hidden
      />
      <div className="relative min-w-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/25" aria-hidden />
          <span className="h-px w-8 bg-gradient-to-r from-primary/50 to-transparent" aria-hidden />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{greeting}</h2>
        <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function DashboardStatTile({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sublabel?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 pb-5 shadow-sm transition-all hover:border-border hover:shadow-md">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/45 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/80 ring-1 ring-border/60 transition-[transform,background-color] group-hover:bg-muted/80 group-hover:scale-[1.02]"
          aria-hidden
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
          {sublabel ? <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function DashboardQuickLink({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-l-2 border-border/80 border-l-transparent bg-card p-4 pl-[0.9375rem] text-left shadow-sm transition-all",
        "hover:border-border hover:border-l-primary/55 hover:bg-muted/40 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div
        className="pointer-events-none absolute right-3 top-3 h-8 w-8 rounded-lg border border-dashed border-primary/10 opacity-0 transition-opacity group-hover:opacity-100 dark:border-primary/15"
        aria-hidden
      />
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border/60 transition-colors group-hover:bg-primary/8 group-hover:text-primary group-hover:ring-primary/15">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{description}</p>
      </div>
      <ChevronRight
        className="mt-1 h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-60"
        aria-hidden
      />
    </Link>
  );
}

export function DashboardSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/15" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
        </span>
        {children}
        <span className="h-px min-w-[2rem] flex-1 max-w-[5rem] bg-gradient-to-r from-primary/25 to-transparent" aria-hidden />
      </h2>
      <div
        className="h-px w-full bg-gradient-to-r from-border via-foreground/[0.06] to-border dark:via-white/[0.06]"
        aria-hidden
      />
    </div>
  );
}

/** Пустое состояние списков в кабинете (уведомления, чаты и т.д.) */
export function CabinetEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/90 bg-muted/25 px-5 py-10 text-center sm:px-8">
      {Icon ? (
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/60"
          aria-hidden
        >
          <Icon className="h-6 w-6 opacity-80" />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Горизонтальный разделитель между крупными блоками кабинета */
export function CabinetFancyDivider({ className }: { className?: string }) {
  return (
    <div className={cn("my-4 flex items-center gap-4", className)} role="separator">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border/40" aria-hidden />
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-xs font-bold text-primary shadow-sm">
        ·
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border/40" aria-hidden />
    </div>
  );
}
