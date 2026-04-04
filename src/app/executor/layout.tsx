import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CabinetShell } from "@/components/layout/cabinet-shell";
import { EXECUTOR_NAV } from "@/config/navigation";
import { getSessionUserForAction } from "@/lib/rbac";
import { dashboardPath } from "@/lib/routes";
import { countTotalUnreadChatMessagesForUser } from "@/server/queries/chat-inbox";
import { countUnreadNotifications } from "@/server/queries/notifications";

export default async function ExecutorLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUserForAction();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== Role.EXECUTOR) {
    redirect(dashboardPath(user.role, user.onboardingDone));
  }

  const [unreadNotifications, unreadChatMessages] = await Promise.all([
    countUnreadNotifications(user.id),
    countTotalUnreadChatMessagesForUser(user.id),
  ]);

  return (
    <CabinetShell
      brand="DONE48 · Исполнитель"
      nav={EXECUTOR_NAV}
      userEmail={user.email}
      unreadNotifications={unreadNotifications}
      unreadChatMessages={unreadChatMessages}
      profileHref="/executor/profile"
      showOnboardingCallout={!user.onboardingDone}
    >
      {children}
    </CabinetShell>
  );
}
