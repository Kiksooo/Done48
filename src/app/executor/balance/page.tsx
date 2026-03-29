import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSessionUserForAction } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { listTransactionsForUser } from "@/server/queries/finance";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/lib/finance-labels";
import { PayoutRequestForm } from "./payout-request-form";

export default async function ExecutorBalancePage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) redirect("/login");

  const [profile, txs, settings] = await Promise.all([
    prisma.executorProfile.findUnique({ where: { userId: user.id } }),
    listTransactionsForUser(user.id),
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const minRub = (settings?.minPayoutCents ?? 1000) / 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Баланс и выплаты</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Холд после принятых заказов и заявки на вывод (подтверждает админ)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">Баланс (учёт)</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatMoneyFromCents(profile?.balanceCents ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">В холде</p>
          <p className="mt-1 text-2xl font-semibold">
            {formatMoneyFromCents(profile?.heldCents ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="text-sm text-neutral-500">Мин. вывод</p>
          <p className="mt-1 text-2xl font-semibold">{minRub.toFixed(0)} ₽</p>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-sm font-semibold">Заявка на вывод</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Сумма не больше доступного (баланс + холд). Админ одобрит и отметит выплату вручную.
        </p>
        <div className="mt-4">
          <PayoutRequestForm />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold">История операций</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
              <tr>
                <th className="px-3 py-2">Дата</th>
                <th className="px-3 py-2">Тип</th>
                <th className="px-3 py-2">Сумма</th>
                <th className="px-3 py-2">Заказ</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="px-3 py-2 text-neutral-600">{formatDateTime(t.createdAt)}</td>
                  <td className="px-3 py-2">{TRANSACTION_TYPE_LABELS[t.type]}</td>
                  <td className="px-3 py-2 font-medium">{formatMoneyFromCents(t.amountCents, t.currency)}</td>
                  <td className="px-3 py-2 text-neutral-600">
                    {t.order ? t.order.title.slice(0, 40) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {txs.length === 0 ? (
            <p className="p-4 text-sm text-neutral-500">Операций пока нет.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
