import Link from "next/link";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { listAvailableOrdersForExecutor } from "@/server/queries/orders";

export default async function ExecutorAvailableOrdersPage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) redirect("/login");

  const rows = await listAvailableOrdersForExecutor();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Доступные заказы</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Опубликованные заказы с открытыми откликами
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((o) => (
          <div
            key={o.id}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Link href={`/orders/${o.id}`} className="text-base font-medium hover:underline">
                {o.title}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <span>
                  {o.category.name}
                  {o.subcategory ? ` · ${o.subcategory.name}` : ""} ·{" "}
                  {formatMoneyFromCents(o.budgetCents)} · дедлайн {formatDateTime(o.deadlineAt)}
                  {o.customer.customerProfile?.city
                    ? ` · город: ${o.customer.customerProfile.city}`
                    : ""}
                </span>
                {o.isOfflineWork ? (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                    Выезд
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <OrderStatusBadge status={o.status} />
              <Link
                href={`/orders/${o.id}`}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-600 dark:hover:bg-neutral-900"
              >
                Открыть
              </Link>
            </div>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-500">Сейчас нет доступных заказов для отклика.</p>
        ) : null}
      </div>
    </div>
  );
}
