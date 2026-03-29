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
      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform dark:border-neutral-800 dark:bg-neutral-950 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-neutral-200 px-4 dark:border-neutral-800">
          <span className="truncate text-sm font-semibold tracking-tight">{brand}</span>
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
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Основное меню">
          {nav.map((item) => {
            const active = isNavActive(pathname, item, nav);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900",
                )}
              >
                <NavIcon name={item.icon} className="h-4 w-4 shrink-0 opacity-90" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.href.includes("/notifications") && unreadNotifications > 0 ? (
                  <span className="shrink-0 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white tabular-nums">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-200 p-3 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <p className="truncate" title={userEmail}>
            {userEmail}
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
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
            <p className="truncate text-sm font-medium">{brand}</p>
          </div>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 bg-neutral-50 dark:bg-neutral-950">{children}</main>
      </div>
    </div>
  );
}
