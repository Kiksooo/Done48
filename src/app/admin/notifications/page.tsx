import { redirect } from "next/navigation";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { getSessionUserForAction } from "@/lib/rbac";
import { listNotificationsForUser } from "@/server/queries/notifications";

export default async function AdminNotificationsPage() {
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
    <NotificationInbox
      items={items}
      enableDetailsTools
      emptyCta={{ href: "/admin/orders", label: "К заказам" }}
    />
  );
}
