import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CabinetShell } from "@/components/layout/cabinet-shell";
import { EXECUTOR_NAV } from "@/config/navigation";
import { authOptions } from "@/lib/auth";
import { countUnreadNotifications } from "@/server/queries/notifications";

export default async function ExecutorLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.EXECUTOR) {
    redirect("/login");
  }

  const unreadNotifications = await countUnreadNotifications(session.user.id);

  return (
    <CabinetShell
      brand="DONE48 · Исполнитель"
      nav={EXECUTOR_NAV}
      userEmail={session.user.email ?? ""}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </CabinetShell>
  );
}
