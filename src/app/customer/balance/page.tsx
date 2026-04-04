import Link from "next/link";
import { Role } from "@prisma/client";
import { Receipt } from "lucide-react";
import { redirect } from "next/navigation";
import { CabinetEmptyState } from "@/components/cabinet/dashboard-ui";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { Button } from "@/components/ui/button";
import {
  allowDemoBalanceTopUpWithOplatum,
  getOplatumCheckoutButtonLabel,
  isOplatumBalanceTopUpConfigured,
} from "@/lib/oplatum-config";
import { getSessionUserForAction } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { listTransactionsForUser } from "@/server/queries/finance";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/lib/finance-labels";
import { tryFulfillPendingOplatumTopUp } from "@/server/payments/oplatum-sync-after-return";
import { CustomerTopUpForm } from "./top-up-form";
import { CustomerWithdrawForm } from "./withdraw-form";

export default async function CustomerBalancePage({
  searchParams,
}: {
  searchParams?: { topup?: string | string[] };
}) {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) redirect("/login");

  const topupParam = searchParams?.topup;
  const topupNotice =
    typeof topupParam === "string" ? topupParam : Array.isArray(topupParam) ? topupParam[0] : undefined;

  let justCreditedOplatum = false;
  if (topupNotice === "success") {
    justCreditedOplatum = await tryFulfillPendingOplatumTopUp(user.id);
  }

  const [profile, txs] = await Promise.all([
    prisma.customerProfile.findUnique({ where: { userId: user.id } }),
    listTransactionsForUser(user.id),
  ]);

  const oplatumConfigured = isOplatumBalanceTopUpConfigured();
  const showDemoTopUp =
    !oplatumConfigured ||
    process.env.NODE_ENV !== "production" ||
    allowDemoBalanceTopUpWithOplatum();
  return (
    <div className="space-y-8">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/customer" },
          { label: "Баланс" },
        ]}
        title="Баланс и оплаты"
        description="Пополнение баланса и вывод средств. Безопасная сделка: сумма удерживается до приёмки работы, затем уходит исполнителю (за вычетом комиссии). Ниже — история операций."
      />

      {topupNotice === "success" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          {justCreditedOplatum
            ? "Платёж зачислён на баланс."
            : "Оплата оформлена. Если сумма не появилась, обновите страницу через минуту — зачисление может прийти отдельным уведомлением от кассы."}
        </p>
      ) : null}
      {topupNotice === "cancel" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Оплата отменена. Средства не списывались.
        </p>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Текущий баланс</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          {formatMoneyFromCents(profile?.balanceCents ?? 0)}
        </p>
        <div className="mt-6 space-y-8 border-t border-border pt-6">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Пополнение</h2>
            <div className="mt-3">
              <CustomerTopUpForm
                oplatumConfigured={oplatumConfigured}
                showDemoTopUp={showDemoTopUp}
                oplatumCheckoutButtonLabel={getOplatumCheckoutButtonLabel()}
              />
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
            <div className="p-4">
              <CabinetEmptyState
                icon={Receipt}
                title="История операций пуста"
                description="Здесь появятся пополнения, резервы по безопасной сделке и списания по заказам. Пополнить баланс можно в блоке выше; после работы с заказами строки заполнятся автоматически."
              >
                <Button type="button" size="sm" asChild>
                  <Link href="/customer/orders/new">Создать заказ</Link>
                </Button>
                <Button type="button" size="sm" variant="secondary" asChild>
                  <Link href="/customer/orders">Мои заказы</Link>
                </Button>
              </CabinetEmptyState>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
