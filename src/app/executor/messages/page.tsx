import { MessagesInboxList } from "@/components/messages/messages-inbox";
import { getSessionUserForAction } from "@/lib/rbac";
import { listChatsForInbox } from "@/server/queries/chat-inbox";
import { redirect } from "next/navigation";

export default async function ExecutorMessagesPage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const rows = await listChatsForInbox(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Сообщения</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Переписки по заказам, где вы участвуете. Чат — в карточке заказа.
        </p>
      </div>
      <MessagesInboxList rows={rows} />
    </div>
  );
}
