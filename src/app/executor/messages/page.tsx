import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
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
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/executor" },
          { label: "Сообщения" },
        ]}
        title="Сообщения"
        description="Переписки по заказам, где вы участвуете. Полный чат — в карточке заказа."
      />
      <MessagesInboxList
        rows={rows}
        emptyCta={{ href: "/executor/orders/available", label: "Доступные заказы" }}
      />
    </div>
  );
}
