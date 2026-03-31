import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { getSessionUserForAction } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { listTransactionsForUser } from "@/server/queries/finance";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/lib/finance-labels";
import { CustomerTopUpForm } from "./top-up-form";
import { CustomerWithdrawForm } from "./withdraw-form";

export default async function CustomerBalancePage() {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) redirect("/login");

  const [profile, txs] = await Promise.all([
    prisma.customerProfile.findUnique({ where: { userId: user.id } }),
    listTransactionsForUser(user.id),
  ]);

  return (
    <div className="space-y-8">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/customer" },
          { label: "Баланс" },
        ]}
        title="Баланс и оплаты"
        description="Пополнение и вывод (демо). Безопасная сделка: сумма удерживается до приёмки работы, затем уходит исполнителю (за вычетом комиссии). Ниже — история операций."
      />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Текущий баланс</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {formatMoneyFromCents(profile?.balanceCents ?? 0)}
        </p>
        <div className="mt-6 space-y-8 border-t border-border pt-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Пополнение</h2>
            <div className="mt-3">
              <CustomerTopUpForm />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Вывод средств</h2>
            <div className="mt-3">
              <CustomerWithdrawForm />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">История операций</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2">Дата</th>
                <th className="px-3 py-2">Тип</th>
                <th className="px-3 py-2">Сумма</th>
                <th className="px-3 py-2">Заказ</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-b border-border/80 last:border-0">
                  <td className="px-3 py-2 text-muted-foreground">{formatDateTime(t.createdAt)}</td>
                  <td className="px-3 py-2">{TRANSACTION_TYPE_LABELS[t.type]}</td>
                  <td className="px-3 py-2 font-medium">{formatMoneyFromCents(t.amountCents, t.currency)}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {t.order ? t.order.title.slice(0, 40) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {txs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Операций пока нет.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
