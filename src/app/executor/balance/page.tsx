import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
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
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/executor" },
          { label: "Баланс" },
        ]}
        title="Баланс и выплаты"
        description="Холд после принятых заказов и заявки на вывод (подтверждает администратор)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Баланс (учёт)</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {formatMoneyFromCents(profile?.balanceCents ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">В холде</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {formatMoneyFromCents(profile?.heldCents ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Мин. вывод</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{minRub.toFixed(0)} ₽</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">Заявка на вывод</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Сумма не больше доступного (баланс + холд). Админ одобрит и отметит выплату вручную.
        </p>
        <div className="mt-4">
          <PayoutRequestForm />
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
