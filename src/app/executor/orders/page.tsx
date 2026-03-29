import Link from "next/link";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { listMyExecutorOrders } from "@/server/queries/orders";

export default async function ExecutorOrdersPage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) redirect("/login");

  const rows = await listMyExecutorOrders(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Мои заказы</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Назначенные вам задачи и их статусы
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-3 py-2 font-medium">Заказ</th>
              <th className="px-3 py-2 font-medium">Бюджет</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-3 py-2 font-medium">Дедлайн</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-3 py-2">
                  <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                    {o.title}
                  </Link>
                </td>
                <td className="px-3 py-2">{formatMoneyFromCents(o.budgetCents)}</td>
                <td className="px-3 py-2">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-3 py-2 text-neutral-600">{formatDateTime(o.deadlineAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Пока нет назначенных заказов.</p>
        ) : null}
      </div>
    </div>
  );
}
