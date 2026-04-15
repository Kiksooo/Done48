import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CabinetShell } from "@/components/layout/cabinet-shell";
import { ADMIN_NAV } from "@/config/navigation";
import { getSessionUserForAction } from "@/lib/rbac";
import { dashboardPath } from "@/lib/routes";
import { countUnreadNotifications } from "@/server/queries/notifications";

// Админка зависит от runtime-сессии и БД, не должна статически пререндериться на build.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUserForAction();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== Role.ADMIN) {
    redirect(dashboardPath(user.role, user.onboardingDone));
  }

  const unreadNotifications = await countUnreadNotifications(user.id);

  return (
    <CabinetShell
      brand="DONE48 · Админ"
      nav={ADMIN_NAV}
      userEmail={user.email}
      unreadNotifications={unreadNotifications}
      profileHref="/admin/settings"
    >
      {children}
    </CabinetShell>
  );
}
