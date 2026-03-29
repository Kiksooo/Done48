import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CabinetShell } from "@/components/layout/cabinet-shell";
import { EXECUTOR_NAV } from "@/config/navigation";
import { getSessionUserForAction } from "@/lib/rbac";
import { countUnreadNotifications } from "@/server/queries/notifications";

export default async function ExecutorLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) {
    redirect("/login");
  }

  const unreadNotifications = await countUnreadNotifications(user.id);

  return (
    <CabinetShell
      brand="DONE48 · Исполнитель"
      nav={EXECUTOR_NAV}
      userEmail={user.email}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </CabinetShell>
  );
}
