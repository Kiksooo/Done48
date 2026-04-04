import { redirect } from "next/navigation";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { getSessionUserForAction } from "@/lib/rbac";
import { listNotificationsForUser } from "@/server/queries/notifications";

export default async function ExecutorNotificationsPage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const rows = await listNotificationsForUser(user.id);
  const items = rows.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/executor" },
          { label: "Уведомления" },
        ]}
        title="Уведомления"
        description="События по заказам и платформе. Отметьте прочитанными или перейдите по ссылке."
      />
      <NotificationInbox
        items={items}
        hideHeading
        emptyCta={{ href: "/executor/orders", label: "Мои заказы" }}
      />
    </div>
  );
}
