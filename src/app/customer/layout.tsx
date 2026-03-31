import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CabinetShell } from "@/components/layout/cabinet-shell";
import { CUSTOMER_NAV } from "@/config/navigation";
import { getSessionUserForAction } from "@/lib/rbac";
import { countTotalUnreadChatMessagesForUser } from "@/server/queries/chat-inbox";
import { countUnreadNotifications } from "@/server/queries/notifications";

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    redirect("/login");
  }

  const [unreadNotifications, unreadChatMessages] = await Promise.all([
    countUnreadNotifications(user.id),
    countTotalUnreadChatMessagesForUser(user.id),
  ]);

  return (
    <CabinetShell
      brand="DONE48 · Заказчик"
      nav={CUSTOMER_NAV}
      userEmail={user.email}
      unreadNotifications={unreadNotifications}
      unreadChatMessages={unreadChatMessages}
      profileHref="/customer/profile"
      showOnboardingCallout={!user.onboardingDone}
    >
      {children}
    </CabinetShell>
  );
}
