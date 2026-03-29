import Link from "next/link";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

export default async function ExecutorHomePage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) redirect("/login");

  const [active, revision, completed] = await Promise.all([
    prisma.order.count({
      where: { executorId: user.id, status: { in: ["ASSIGNED", "IN_PROGRESS", "SUBMITTED"] } },
    }),
    prisma.order.count({
      where: { executorId: user.id, status: "REVISION" },
    }),
    prisma.order.count({
      where: { executorId: user.id, status: { in: ["COMPLETED", "ACCEPTED"] } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Задачи и доступные заказы</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">Активные</p>
          <p className="mt-1 text-2xl font-semibold">{active}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">На доработке</p>
          <p className="mt-1 text-2xl font-semibold">{revision}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">Завершённые</p>
          <p className="mt-1 text-2xl font-semibold">{completed}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <Link href="/executor/orders/available" className="underline">
          Доступные заказы
        </Link>
        <Link href="/executor/orders" className="underline">
          Мои заказы
        </Link>
      </div>
    </div>
  );
}
