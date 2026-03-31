import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { MessagesInboxList } from "@/components/messages/messages-inbox";
import { getSessionUserForAction } from "@/lib/rbac";
import { listChatsForInbox } from "@/server/queries/chat-inbox";
import { redirect } from "next/navigation";

export default async function CustomerMessagesPage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const rows = await listChatsForInbox(user.id);

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/customer" },
          { label: "Сообщения" },
        ]}
        title="Сообщения"
        description="Переписки по заказам. Полный чат открывается в карточке заказа."
      />
      <MessagesInboxList rows={rows} />
    </div>
  );
}
