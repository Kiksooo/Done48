"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { landingNavLinks } from "@/components/landing/nav-data";

export function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-[3.75rem] max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-2xl py-1 pr-2 transition-transform active:scale-[0.98]"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-600 text-sm font-bold text-white shadow-md shadow-primary/30 ring-4 ring-primary/15 transition-[transform,box-shadow] group-hover:scale-105 group-hover:shadow-lg dark:to-sky-500">
            D
          </span>
          <span className="truncate text-lg font-bold tracking-tight">DONE48</span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 rounded-full border border-border/40 bg-card/70 px-1 py-1 shadow-sm backdrop-blur-md md:flex"
          aria-label="По странице"
        >
          {landingNavLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              title={l.hint}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden rounded-full sm:inline-flex">
            <Link href="/login">Войти</Link>
          </Button>
          <Button size="sm" className="rounded-full px-4 shadow-md shadow-primary/20 sm:px-5" asChild>
            <Link href="/register">Регистрация</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 shrink-0 rounded-full p-0 md:hidden"
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 top-[3.75rem] z-40 bg-foreground/15 backdrop-blur-[1px] sm:top-16 md:hidden"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        id="landing-mobile-nav"
        className={cn(
          "fixed inset-x-0 top-[3.75rem] z-50 max-h-[min(70vh,calc(100dvh-3.75rem))] overflow-y-auto border-b border-border/40 bg-card/95 shadow-xl backdrop-blur-xl transition-[opacity,transform] duration-200 sm:top-16 md:hidden",
          open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
        aria-hidden={!open}
      >
        <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4" aria-label="Меню на мобильном">
          {landingNavLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="flex flex-col rounded-2xl px-4 py-3.5 transition-colors hover:bg-primary/8 active:bg-primary/12"
              onClick={() => setOpen(false)}
            >
              <span className="font-semibold text-foreground">{l.label}</span>
              <span className="text-xs text-muted-foreground">{l.hint}</span>
            </a>
          ))}
          <div className="pt-2">
            <Button variant="outline" className="mt-2 w-full rounded-2xl border-dashed" asChild>
              <Link href="/login" onClick={() => setOpen(false)}>
                Уже есть аккаунт — войти
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
