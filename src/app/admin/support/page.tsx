import Link from "next/link";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { SupportChatPanel } from "@/components/feedback/support-chat-panel";
import { getSessionUserForAction } from "@/lib/rbac";
import { listSupportDialogsForAdmin, listSupportMessagesForUser } from "@/server/queries/support-chat";
import { cn } from "@/lib/utils";

type SearchParams = { userId?: string | string[] };

export default async function AdminSupportPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.ADMIN) redirect("/login");

  const dialogs = await listSupportDialogsForAdmin();
  const raw = searchParams.userId;
  const selectedUserId = Array.isArray(raw) ? raw[0] : raw;
  const activeUserId = selectedUserId && dialogs.some((d) => d.userId === selectedUserId) ? selectedUserId : dialogs[0]?.userId;

  const messages = activeUserId ? await listSupportMessagesForUser(activeUserId) : [];

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[{ label: "Дашборд", href: "/admin" }, { label: "Чат поддержки" }]}
        title="Чат поддержки"
        description="Диалоги пользователей с администраторами. Выберите пользователя слева и отправьте ответ."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">Диалоги</div>
          <div className="max-h-[65vh] overflow-y-auto">
            {dialogs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Пока нет обращений.</p>
            ) : (
              dialogs.map((d) => (
                <Link
                  key={d.userId}
                  href={`/admin/support?userId=${encodeURIComponent(d.userId)}`}
                  className={cn(
                    "block border-b border-border/70 px-4 py-3 transition-colors last:border-0 hover:bg-muted/50",
                    activeUserId === d.userId && "bg-primary/5",
                  )}
                >
                  <p className="truncate text-sm font-medium text-foreground">{d.userEmail}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.lastMessage || "—"}</p>
                </Link>
              ))
            )}
          </div>
        </aside>

        <section>
          {activeUserId ? (
            <SupportChatPanel
              mode="admin"
              targetUserId={activeUserId}
              messages={messages.map((m) => ({
                id: m.id,
                author: m.author,
                text: m.text,
                createdAtIso: m.createdAt.toISOString(),
              }))}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
              Выберите диалог слева.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
