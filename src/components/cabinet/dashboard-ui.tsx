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
      <div className="relative min-w-0">
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
    <div className="group rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-border hover:shadow-md">
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
        "group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-border/80 bg-card p-4 text-left shadow-sm transition-all",
        "hover:border-border hover:bg-muted/40 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground ring-1 ring-border/60 transition-colors group-hover:bg-muted/80 group-hover:text-primary">
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
    <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/25" aria-hidden />
      {children}
      <span className="h-px min-w-[2rem] flex-1 max-w-[4rem] bg-gradient-to-r from-border to-transparent" aria-hidden />
    </h2>
  );
}
