/** Чистая функция: комиссия и доля специалиста из бюджета заказа (копейки). Без обращения к БД — можно в клиенте. */
export function splitOrderBudget(budgetCents: number, feePercent: number) {
  const feeCents = Math.min(budgetCents, Math.round((budgetCents * feePercent) / 100));
  const executorCents = budgetCents - feeCents;
  return { feeCents, executorCents };
}
