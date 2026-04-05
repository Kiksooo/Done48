"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Крупные «таблетки»: проще попасть пальцем, выглядят дружелюбнее, чем голые подчёркивания. */
export const publicNavItemClassName = cn(
  "inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm",
  "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out",
  "hover:border-primary/35 hover:bg-muted/50 hover:shadow-md",
  "active:scale-[0.98]",
  "dark:bg-card/70 dark:hover:bg-muted/30",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
);

type Props = {
  homeHref?: string;
  extra?: ReactNode;
  className?: string;
};

/** Публичные страницы: назад по истории + главная + вход. */
export function PublicPageNav({ homeHref = "/", extra, className }: Props) {
  const router = useRouter();

  return (
    <nav
      className={cn("flex flex-wrap gap-2", className)}
      aria-label="Навигация по сайту"
    >
      <button type="button" onClick={() => router.back()} className={publicNavItemClassName}>
        ← Назад
      </button>
      <Link href={homeHref} className={publicNavItemClassName}>
        На главную
      </Link>
      {extra}
      <Link href="/login" className={publicNavItemClassName}>
        Войти
      </Link>
    </nav>
  );
}
