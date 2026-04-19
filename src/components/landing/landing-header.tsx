"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { landingNavLinks } from "@/components/landing/nav-data";

const mobileNavTop = "top-14 sm:top-14";

function isInternalLandingHref(href: string) {
  return href.startsWith("/");
}

function LandingMobileNavPanel({ onClose }: { onClose: () => void }) {
  return (
    <nav
      className="mx-auto max-w-7xl space-y-1 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      aria-label="Меню на мобильном"
    >
      {landingNavLinks.map((l) =>
        isInternalLandingHref(l.href) ? (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col rounded-xl px-3 py-3 transition-colors hover:bg-muted/60 active:bg-muted/80"
            onClick={onClose}
          >
            <span className="font-semibold text-foreground">{l.label}</span>
            <span className="text-xs text-muted-foreground">{l.hint}</span>
          </Link>
        ) : (
          <a
            key={l.href}
            href={l.href}
            className="flex flex-col rounded-xl px-3 py-3 transition-colors hover:bg-muted/60 active:bg-muted/80"
            onClick={onClose}
          >
            <span className="font-semibold text-foreground">{l.label}</span>
            <span className="text-xs text-muted-foreground">{l.hint}</span>
          </a>
        ),
      )}
      <div className="space-y-2 pt-2">
        <Button className="w-full rounded-xl shadow-sm" asChild>
          <Link href="/register" onClick={onClose}>
            Начать бесплатно
          </Link>
        </Button>
        <Button variant="outline" className="w-full rounded-xl" asChild>
          <Link href="/login" onClick={onClose}>
            Уже есть аккаунт — войти
          </Link>
        </Button>
      </div>
    </nav>
  );
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const closeOverlay = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  return (
    <Fragment>
      <header
        className={cn(
          "sticky top-0 border-b border-border/40 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
          open ? "z-[110]" : "z-50",
        )}
      >
        <div className="mx-auto flex h-14 min-w-0 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 rounded-lg py-1 pr-1 transition-opacity hover:opacity-90"
            onClick={close}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              D
            </span>
            <span className="whitespace-nowrap text-base font-semibold tracking-tight text-foreground">DONE48</span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="По странице"
          >
            {landingNavLinks.map((l) =>
              isInternalLandingHref(l.href) ? (
                <Link
                  key={l.href}
                  href={l.href}
                  title={l.hint}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  title={l.hint}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  {l.label}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden h-9 rounded-md px-3 sm:inline-flex">
              <Link href="/login">Войти</Link>
            </Button>
            <Button
              size="sm"
              className="h-9 shrink-0 rounded-md px-2.5 text-xs shadow-sm sm:px-4 sm:text-sm"
              asChild
            >
              <Link href="/register">Начать бесплатно</Link>
            </Button>
            <Button
              ref={menuButtonRef}
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 shrink-0 rounded-md p-0 md:hidden"
              aria-expanded={open}
              aria-controls="landing-mobile-nav"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {mounted && open
        ? createPortal(
            <Fragment>
              <button
                type="button"
                className={cn(
                  "fixed bottom-0 left-0 right-0 z-[100] bg-foreground/25 backdrop-blur-sm md:hidden",
                  mobileNavTop,
                )}
                aria-label="Закрыть меню"
                onClick={closeOverlay}
              />
              <div
                id="landing-mobile-nav"
                className={cn(
                  "fixed inset-x-0 z-[105] max-h-[min(85dvh,calc(100dvh-3.5rem))] overflow-y-auto border-b border-border/40 bg-card shadow-lg md:hidden",
                  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 duration-200",
                  mobileNavTop,
                )}
                aria-hidden={false}
              >
                <LandingMobileNavPanel onClose={close} />
              </div>
            </Fragment>,
            document.body,
          )
        : null}
    </Fragment>
  );
}
