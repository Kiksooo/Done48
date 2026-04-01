import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { SupportChatPanel } from "@/components/feedback/support-chat-panel";
import { getSessionUserForAction } from "@/lib/rbac";
import { listSupportMessagesForUser } from "@/server/queries/support-chat";

export default async function CustomerFeedbackPage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) redirect("/login");

  const messages = await listSupportMessagesForUser(user.id);

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/customer" },
          { label: "Обратная связь" },
        ]}
        title="Обратная связь"
        description="Чат с администратором: задавайте вопросы по заказам и платформе. Ответ появится здесь."
      />
      <SupportChatPanel
        mode="user"
        messages={messages.map((m) => ({
          id: m.id,
          author: m.author,
          text: m.text,
          createdAtIso: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
