import Link from "next/link";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { formatMoneyFromCents } from "@/lib/format";
import { countCustomerOrdersByBucket, sumCustomerSpend } from "@/server/queries/orders";

export default async function CustomerHomePage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) redirect("/login");

  const [buckets, spendCents] = await Promise.all([
    countCustomerOrdersByBucket(user.id),
    sumCustomerSpend(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Краткая сводка по заказам</p>
        </div>
        <Link
          href="/customer/orders/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Новый заказ
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">В работе</p>
          <p className="mt-1 text-2xl font-semibold">{buckets.active}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">Ожидание / модерация</p>
          <p className="mt-1 text-2xl font-semibold">{buckets.waiting}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">На проверке</p>
          <p className="mt-1 text-2xl font-semibold">{buckets.review}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">Расходы (принятые)</p>
          <p className="mt-1 text-2xl font-semibold">{formatMoneyFromCents(spendCents)}</p>
        </div>
      </div>

      <div>
        <Link
          href="/customer/orders"
          className="text-sm font-medium text-neutral-900 underline dark:text-neutral-100"
        >
          Все заказы →
        </Link>
      </div>
    </div>
  );
}
