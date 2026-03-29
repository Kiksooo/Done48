import type { ReactNode } from "react";
import type { CabinetNavItem } from "@/config/navigation";
import { CabinetChrome } from "@/components/layout/cabinet-chrome";

type CabinetShellProps = {
  brand: string;
  nav: CabinetNavItem[];
  userEmail: string;
  /** Непрочитанные in-app уведомления (бейдж у пункта «Уведомления»). */
  unreadNotifications?: number;
  children: ReactNode;
};

export function CabinetShell({
  brand,
  nav,
  userEmail,
  unreadNotifications = 0,
  children,
}: CabinetShellProps) {
  return (
    <CabinetChrome
      brand={brand}
      nav={nav}
      userEmail={userEmail}
      unreadNotifications={unreadNotifications}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </CabinetChrome>
  );
}
