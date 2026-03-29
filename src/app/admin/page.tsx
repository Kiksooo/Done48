import Link from "next/link";
import { formatMoneyFromCents } from "@/lib/format";
import { countAdminOverview } from "@/server/queries/orders";

export default async function AdminHomePage() {
  const o = await countAdminOverview();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Сводка платформы (MVP)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">Пользователи</p>
          <p className="mt-1 text-2xl font-semibold">{o.users}</p>
          <p className="mt-1 text-xs text-neutral-500">
            заказчики {o.customers} · исполнители {o.executors}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">Активные заказы</p>
          <p className="mt-1 text-2xl font-semibold">{o.activeOrders}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">GMV (оценка по бюджетам)</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoneyFromCents(o.gmvCents)}</p>
          <p className="mt-1 text-xs text-neutral-500">Без отменённых и черновиков</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <Link href="/admin/users" className="underline">
          Пользователи
        </Link>
        <Link href="/admin/orders" className="underline">
          Заказы
        </Link>
        <Link href="/admin/payments" className="underline">
          Платежи
        </Link>
        <Link href="/admin/payouts" className="underline">
          Выплаты
        </Link>
      </div>
    </div>
  );
}
