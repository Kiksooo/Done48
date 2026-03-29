import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import { TRANSACTION_TYPE_LABELS } from "@/lib/finance-labels";
import { listAllTransactions } from "@/server/queries/finance";

export default async function AdminPaymentsPage() {
  const txs = await listAllTransactions(300);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Платежи и проводки</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Все транзакции платформы (демо-учёт)
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-3 py-2">Дата</th>
              <th className="px-3 py-2">Тип</th>
              <th className="px-3 py-2">Сумма</th>
              <th className="px-3 py-2">От</th>
              <th className="px-3 py-2">Кому</th>
              <th className="px-3 py-2">Заказ</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-3 py-2 whitespace-nowrap text-neutral-600">
                  {formatDateTime(t.createdAt)}
                </td>
                <td className="px-3 py-2">{TRANSACTION_TYPE_LABELS[t.type]}</td>
                <td className="px-3 py-2 font-medium">{formatMoneyFromCents(t.amountCents, t.currency)}</td>
                <td className="px-3 py-2 text-neutral-600">{t.fromUser?.email ?? "—"}</td>
                <td className="px-3 py-2 text-neutral-600">{t.toUser?.email ?? "—"}</td>
                <td className="px-3 py-2 text-neutral-600">
                  {t.order ? `${t.order.publicId.slice(0, 8)}…` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {txs.length === 0 ? <p className="p-4 text-sm text-neutral-500">Пока нет проводок.</p> : null}
      </div>
    </div>
  );
}
