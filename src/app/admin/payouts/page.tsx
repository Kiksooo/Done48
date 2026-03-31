import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { PAYOUT_STATUS_LABELS } from "@/lib/finance-labels";
import { listPayouts } from "@/server/queries/finance";
import { PayoutActions } from "./payout-actions";

export default async function AdminPayoutsPage() {
  const payouts = await listPayouts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Заявки на вывод</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Одобрение и отметка фактической выплаты исполнителю
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-3 py-2">Дата</th>
              <th className="px-3 py-2">Исполнитель</th>
              <th className="px-3 py-2">Сумма</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Реквизиты</th>
              <th className="px-3 py-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-3 py-2 whitespace-nowrap text-neutral-600">
                  {formatDateTime(p.createdAt)}
                </td>
                <td className="px-3 py-2">{p.executor.email}</td>
                <td className="px-3 py-2 font-medium">{formatMoneyFromCents(p.amountCents, p.currency)}</td>
                <td className="px-3 py-2">{PAYOUT_STATUS_LABELS[p.status]}</td>
                <td className="max-w-xs truncate px-3 py-2 text-neutral-600" title={p.payoutDetails}>
                  {p.payoutDetails}
                </td>
                <td className="px-3 py-2">
                  <PayoutActions payoutId={p.id} status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payouts.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">Заявок пока нет.</p>
        ) : null}
      </div>
    </div>
  );
}
