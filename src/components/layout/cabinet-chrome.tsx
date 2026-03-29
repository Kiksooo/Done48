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
  children: React.ReactNode;
};

export function CabinetChrome({
  brand,
  nav,
  userEmail,
  unreadNotifications = 0,
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
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-border bg-card/95 shadow-elevated backdrop-blur-md transition-transform dark:bg-card/90 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
          <span className="truncate bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-sm font-semibold tracking-tight text-transparent">
            {brand}
          </span>
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
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Основное меню">
          {nav.map((item) => {
            const active = isNavActive(pathname, item, nav);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-[background,color,box-shadow]",
                  active
                    ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/10"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
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
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 text-xs text-muted-foreground">
          <p className="truncate" title={userEmail}>
            {userEmail}
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
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
        <main className="flex-1 bg-background">{children}</main>
      </div>
    </div>
  );
}
