import type { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { listOrdersForAdmin } from "@/server/queries/orders";

const STATUSES: Array<OrderStatus | "ALL"> = [
  "ALL",
  "NEW",
  "ON_MODERATION",
  "PUBLISHED",
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION",
  "ACCEPTED",
  "COMPLETED",
  "DISPUTED",
  "CANCELED",
];

type SearchParams = { status?: string | string[] };

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const st = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const filter =
    st && STATUSES.includes(st as OrderStatus | "ALL") ? (st as OrderStatus | "ALL") : "ALL";

  const rows = await listOrdersForAdmin({ status: filter });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Заказы</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Все заказы платформы</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "ALL" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === s
                ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
            }`}
          >
            {s === "ALL" ? "Все" : s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-3 py-2 font-medium">Номер</th>
              <th className="px-3 py-2 font-medium">Название</th>
              <th className="px-3 py-2 font-medium">Заказчик</th>
              <th className="px-3 py-2 font-medium">Исполнитель</th>
              <th className="px-3 py-2 font-medium">Бюджет</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-3 py-2 font-medium">Обновлён</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="max-w-[14rem] px-3 py-2 font-mono text-xs break-all">
                  <Link href={`/orders/${o.id}`} className="underline">
                    {o.publicId}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/orders/${o.id}`} className="hover:underline">
                    {o.title}
                  </Link>
                </td>
                <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">{o.customer.email}</td>
                <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">
                  {o.executor?.email ?? "—"}
                </td>
                <td className="px-3 py-2">{formatMoneyFromCents(o.budgetCents, o.currency)}</td>
                <td className="px-3 py-2">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-3 py-2 text-neutral-600">{formatDateTime(o.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-4 text-sm text-neutral-500">Нет заказов.</p> : null}
      </div>
    </div>
  );
}
