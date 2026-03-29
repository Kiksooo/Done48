import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSessionUserForAction } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { listTransactionsForUser } from "@/server/queries/finance";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/lib/finance-labels";
import { CustomerTopUpForm } from "./top-up-form";

export default async function CustomerBalancePage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) redirect("/login");

  const [profile, txs] = await Promise.all([
    prisma.customerProfile.findUnique({ where: { userId: user.id } }),
    listTransactionsForUser(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Баланс и оплаты</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Пополнение (демо), безопасные сделки: сумма блокируется на площадке до приёмки работы, затем уходит исполнителю
          (за вычетом комиссии) — и история операций.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-sm text-neutral-500">Текущий баланс</p>
        <p className="mt-1 text-3xl font-semibold">
          {formatMoneyFromCents(profile?.balanceCents ?? 0)}
        </p>
        <div className="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-900">
          <h2 className="text-sm font-semibold">Пополнение</h2>
          <div className="mt-3">
            <CustomerTopUpForm />
          </div>
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
