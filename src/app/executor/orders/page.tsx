import Link from "next/link";
import { Briefcase } from "lucide-react";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { CabinetEmptyState } from "@/components/cabinet/dashboard-ui";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { listMyExecutorOrders } from "@/server/queries/orders";

export default async function ExecutorOrdersPage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) redirect("/login");

  const rows = await listMyExecutorOrders(user.id);

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/executor" },
          { label: "Мои заказы" },
        ]}
        title="Мои заказы"
        description="Задачи, где вы назначены исполнителем: статусы, дедлайны и переход в карточку заказа."
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-3 py-2 font-medium">Заказ</th>
              <th className="px-3 py-2 font-medium">Бюджет</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-3 py-2 font-medium">Дедлайн</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-border/80 last:border-0">
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/orders/${o.id}`} className="font-medium text-foreground hover:underline">
                      {o.title}
                    </Link>
                    {o.isOfflineWork ? (
                      <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                        Выезд
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2">{formatMoneyFromCents(o.budgetCents, o.currency)}</td>
                <td className="px-3 py-2">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{formatDateTime(o.deadlineAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <div className="p-4">
            <CabinetEmptyState
              icon={Briefcase}
              title="Пока нет назначенных заказов"
              description="Когда заказчик выберет вас по отклику, заказ появится здесь. Пока можно откликаться на открытые задачи."
            >
              <Button size="sm" variant="secondary" asChild>
                <Link href="/executor/orders/available">Доступные заказы</Link>
              </Button>
            </CabinetEmptyState>
          </div>
        ) : null}
      </div>
    </div>
  );
}
