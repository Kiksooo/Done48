import { formatMoneyFromCents } from "@/lib/format";
import { splitOrderBudget } from "@/lib/order-budget-math";

type Base = {
  budgetCents: number;
  currency: string;
  feePercent: number;
};

/** Карточка заказа: основная строка — исполнителю; ниже комиссия и сумма к резерву. */
export function OrderBudgetDetailBlock({
  budgetCents,
  currency,
  feePercent,
  budgetTypeLine,
}: Base & { budgetTypeLine: string }) {
  const { feeCents, executorCents } = splitOrderBudget(budgetCents, feePercent);
  return (
    <div>
      <p className="text-neutral-500 dark:text-neutral-400">Сумма заказа</p>
      <p className="font-medium text-neutral-900 dark:text-neutral-100">
        {formatMoneyFromCents(executorCents, currency)} · {budgetTypeLine}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        За вычетом комиссии платформы {feePercent}% ({formatMoneyFromCents(feeCents, currency)}). С баланса к резерву
        под заказ: {formatMoneyFromCents(budgetCents, currency)}.
      </p>
    </div>
  );
}

/** Компактно: для таблиц и списков. */
export function OrderBudgetTableCell({ budgetCents, currency, feePercent }: Base) {
  const { feeCents, executorCents } = splitOrderBudget(budgetCents, feePercent);
  return (
    <div className="leading-tight">
      <span className="font-medium text-foreground">{formatMoneyFromCents(executorCents, currency)}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        комиссия {feePercent}%: {formatMoneyFromCents(feeCents, currency)} · к резерву{" "}
        {formatMoneyFromCents(budgetCents, currency)}
      </span>
    </div>
  );
}

/** Одна строка для мобильных карточек: исполнителю (к резерву …). */
export function OrderBudgetOneLine({ budgetCents, currency, feePercent }: Base) {
  const { executorCents } = splitOrderBudget(budgetCents, feePercent);
  return (
    <span>
      {formatMoneyFromCents(executorCents, currency)} исполнителю · к резерву{" "}
      {formatMoneyFromCents(budgetCents, currency)}
    </span>
  );
}
