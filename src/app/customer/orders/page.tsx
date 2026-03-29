import type { CustomerOrderFilter } from "@/server/queries/orders";
import Link from "next/link";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { listOrdersForCustomer } from "@/server/queries/orders";
import { cn } from "@/lib/utils";

const FILTERS: { key: CustomerOrderFilter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "new", label: "Новые" },
  { key: "active", label: "В работе" },
  { key: "review", label: "На проверке" },
  { key: "done", label: "Завершённые" },
  { key: "disputed", label: "Спорные" },
  { key: "canceled", label: "Отменённые" },
];

type SearchParams = { filter?: string | string[] };

export default async function CustomerOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) redirect("/login");

  const raw = searchParams.filter;
  const f = Array.isArray(raw) ? raw[0] : raw;
  const filter = (FILTERS.some((x) => x.key === f) ? f : "all") as CustomerOrderFilter;

  const rows = await listOrdersForCustomer(user.id, filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Мои заказы</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Переход к карточке заказа — общий экран для всех ролей.
          </p>
        </div>
        <Link
          href="/customer/orders/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Создать заказ
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/customer/orders" : `/customer/orders?filter=${f.key}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              filter === f.key
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Исполнитель</th>
              <th className="px-4 py-3 font-medium">Бюджет</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Дедлайн</th>
              <th className="px-4 py-3 font-medium">Обновлён</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/orders/${o.id}`} className="text-neutral-900 underline dark:text-neutral-100">
                    {o.publicId.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${o.id}`} className="font-medium hover:underline">
                    {o.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {o.executor?.email ?? "—"}
                </td>
                <td className="px-4 py-3">{formatMoneyFromCents(o.budgetCents, o.currency)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-neutral-600">{formatDateTime(o.deadlineAt)}</td>
                <td className="px-4 py-3 text-neutral-600">{formatDateTime(o.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-neutral-500">Нет заказов в этой выборке.</p>
        ) : null}
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((o) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="block rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-medium">{o.title}</h2>
              <OrderStatusBadge status={o.status} />
            </div>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {formatMoneyFromCents(o.budgetCents)} · {formatDateTime(o.deadlineAt)}
            </p>
          </Link>
        ))}
        {rows.length === 0 ? <p className="text-sm text-neutral-500">Нет заказов.</p> : null}
      </div>
    </div>
  );
}
