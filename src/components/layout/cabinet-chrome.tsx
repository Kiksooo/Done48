"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CabinetNavItem } from "@/config/navigation";
import { isNavActive } from "@/config/navigation";
import { NavIcon } from "@/components/layout/nav-icons";
import { Menu, X } from "lucide-react";

type CabinetChromeProps = {
  brand: string;
  nav: CabinetNavItem[];
  userEmail: string;
  unreadNotifications?: number;
  unreadChatMessages?: number;
  profileHref?: string;
  helpHref?: string;
  children: React.ReactNode;
};

export function CabinetChrome({
  brand,
  nav,
  userEmail,
  unreadNotifications = 0,
  unreadChatMessages = 0,
  profileHref,
  helpHref = "/legal",
  children,
}: CabinetChromeProps) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-border bg-gradient-to-b from-card via-card to-muted/25 shadow-sm transition-transform lg:static lg:translate-x-0",
          "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-px before:bg-gradient-to-b before:from-border before:via-foreground/12 before:to-border",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="relative z-20 flex h-14 items-center justify-between gap-2 border-b border-border/90 bg-muted/20 px-4 backdrop-blur-sm">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              aria-hidden
            >
              D
            </span>
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">{brand}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Закрыть меню"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="relative z-20 flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Основное меню">
          {nav.map((item) => {
            const active = isNavActive(pathname, item, nav);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full before:bg-primary"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <NavIcon
                  name={item.icon}
                  className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-70")}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.href.includes("/notifications") && unreadNotifications > 0 ? (
                  <span className="shrink-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white tabular-nums shadow-sm">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                ) : null}
                {item.href.includes("/messages") && unreadChatMessages > 0 ? (
                  <span
                    className="shrink-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white tabular-nums shadow-sm"
                    aria-label={`Непрочитанных сообщений: ${unreadChatMessages}`}
                  >
                    {unreadChatMessages > 99 ? "99+" : unreadChatMessages}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="relative z-20 space-y-2 border-t border-border/90 bg-muted/25 p-3 backdrop-blur-sm">
          {profileHref ? (
            <Link
              href={profileHref}
              className="block rounded-md px-1 py-0.5 text-xs font-medium text-primary hover:underline"
            >
              Профиль
            </Link>
          ) : null}
          {helpHref ? (
            <Link
              href={helpHref}
              className="block rounded-md px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Помощь и документы
            </Link>
          ) : null}
          <p
            className="truncate rounded-lg border border-border/70 bg-card/90 px-2.5 py-2 text-xs text-muted-foreground shadow-sm"
            title={userEmail}
          >
            {userEmail}
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/90 bg-background/90 px-4 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Открыть меню"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1 lg:hidden">
            <p className="truncate text-sm font-semibold text-foreground">{brand}</p>
          </div>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </header>
        <main className="cabinet-main-canvas flex-1 bg-muted/40 dark:bg-background">{children}</main>
      </div>
    </div>
  );
}
