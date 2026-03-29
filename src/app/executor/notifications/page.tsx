import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NotificationInbox } from "@/components/notifications/notification-inbox";
import { authOptions } from "@/lib/auth";
import { listNotificationsForUser } from "@/server/queries/notifications";

export default async function ExecutorNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const rows = await listNotificationsForUser(session.user.id);
  const items = rows.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    link: n.link,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  return <NotificationInbox items={items} />;
}
