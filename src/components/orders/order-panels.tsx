"use client";

import type {
  OrderStatus,
  PaymentStatus,
  ProposalStatus,
  Role,
  VisibilityType,
} from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoneyFromCents } from "@/lib/format";
import { PAYMENT_STATUS_LABELS } from "@/lib/order-labels";
import { customerReserveOrderAction } from "@/server/actions/finance/customer-finance";
import {
  adminAcceptProposalAction,
  adminAssignExecutorAction,
  adminPublishOrder,
  adminSetOrderStatusAction,
  adminUnassignExecutorAction,
} from "@/server/actions/orders/admin-orders";
import { adminDeleteOrderAction, customerDeleteOrderAction } from "@/server/actions/orders/delete-order";
import {
  customerAcceptProposalAction,
  customerAcceptWorkAction,
  customerCancelOrderAction,
  customerCompleteOrderAction,
  customerRequestRevisionAction,
  customerUnassignExecutorAction,
} from "@/server/actions/orders/customer-orders";
import {
  executorCompleteOrderAction,
  executorCreateProposalAction,
  executorStartWorkAction,
  executorSubmitWorkAction,
} from "@/server/actions/orders/executor-orders";
import { openDisputeAction } from "@/server/actions/disputes";
import { OrderCustomerPartnersManage } from "@/components/orders/order-customer-partners-manage";

type ProposalRow = {
  id: string;
  status: ProposalStatus;
  executorId: string;
  label: string;
  offeredCents: number | null;
  offeredDays: number | null;
};

type ExecutorOption = { id: string; label: string };

function canCustomerDeleteOrderSnapshot(snapshot: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  executorId: string | null;
}): boolean {
  if (snapshot.paymentStatus === "PAYOUT_PENDING" || snapshot.paymentStatus === "PAYOUT_DONE") {
    return false;
  }
  if (snapshot.executorId) return false;
  if (!["DRAFT", "NEW", "ON_MODERATION", "PUBLISHED", "CANCELED"].includes(snapshot.status)) {
    return false;
  }
  if (!["UNPAID", "RESERVED", "REFUNDED"].includes(snapshot.paymentStatus)) {
    return false;
  }
  return true;
}

function canAdminDeleteOrderSnapshot(snapshot: {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
}): boolean {
  if (snapshot.paymentStatus === "PAYOUT_PENDING" || snapshot.paymentStatus === "PAYOUT_DONE") {
    return false;
  }
  if (snapshot.status === "ACCEPTED" || snapshot.status === "COMPLETED") {
    return false;
  }
  if (
    ![
      "DRAFT",
      "NEW",
      "ON_MODERATION",
      "PUBLISHED",
      "ASSIGNED",
      "IN_PROGRESS",
      "SUBMITTED",
      "REVISION",
      "CANCELED",
      "DISPUTED",
    ].includes(snapshot.status)
  ) {
    return false;
  }
  if (!["UNPAID", "RESERVED", "REFUNDED"].includes(snapshot.paymentStatus)) {
    return false;
  }
  return true;
}

const ALL_STATUSES: OrderStatus[] = [
  "DRAFT",
  "NEW",
  "ON_MODERATION",
  "PUBLISHED",
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION",
  "ACCEPTED",
  "DISPUTED",
  "CANCELED",
  "COMPLETED",
];

export function OrderPanels(props: {
  orderId: string;
  viewerRole: Role;
  viewerId: string;
  snapshot: {
    status: OrderStatus;
    visibilityType: VisibilityType;
    executorId: string | null;
    customerId: string;
    customerPartnerUserIds: string[];
    customerPartnersListed: { userId: string; label: string }[];
    proposals: ProposalRow[];
    paymentStatus: PaymentStatus;
    budgetCents: number;
    currency: string;
    canOpenDispute: boolean;
    hasActiveDispute: boolean;
  };
  executorOptions?: ExecutorOption[];
  canPropose: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        setMsg(r.error ?? label);
        return;
      }
      router.refresh();
    });
  }

  const { orderId, viewerRole, viewerId, snapshot, executorOptions = [], canPropose } = props;
  const [executorPick, setExecutorPick] = useState(executorOptions[0]?.id ?? "");
  const [adminStatus, setAdminStatus] = useState<OrderStatus>(snapshot.status);
  const [adminNote, setAdminNote] = useState("");

  const [offerRub, setOfferRub] = useState<number | "">("");
  const [offerDays, setOfferDays] = useState<number | "">("");
  const [offerMsg, setOfferMsg] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  return (
    <div className="space-y-6">
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}

      {viewerRole === "ADMIN" ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold">Действия администратора</h2>
          {canAdminDeleteOrderSnapshot(snapshot) ? (
            <div className="mt-3 rounded-md border border-red-200/80 bg-red-50/60 p-3 dark:border-red-900/50 dark:bg-red-950/25">
              <p className="text-xs text-red-900 dark:text-red-100/90">
                Удаление безвозвратно сотрёт заказ, отклики, чат и споры. При активном резерве сумма вернётся на баланс
                заказчика.
              </p>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="mt-2"
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      "Удалить заказ из базы безвозвратно? Это действие нельзя отменить.",
                    )
                  ) {
                    return;
                  }
                  setMsg(null);
                  startTransition(async () => {
                    const r = await adminDeleteOrderAction({ orderId });
                    if (!r.ok) {
                      setMsg(r.error ?? "Не удалось удалить");
                      return;
                    }
                    router.push("/admin/orders");
                  });
                }}
              >
                Удалить заказ
              </Button>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {snapshot.status === "NEW" || snapshot.status === "ON_MODERATION" ? (
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() => run("publish", () => adminPublishOrder(orderId))}
              >
                Опубликовать
              </Button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Назначить исполнителя</Label>
              <p className="text-xs text-neutral-500">
                Назначить исполнителя можно только после того, как заказчик зарезервировал сумму заказа с баланса
                (резерв под заказ до приёмки; безопасная сделка).
              </p>
              {executorOptions.length === 0 ? (
                <p className="text-sm text-neutral-500">Нет активных исполнителей в системе.</p>
              ) : (
                <>
                  <select
                    className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                    value={executorPick}
                    onChange={(e) => setExecutorPick(e.target.value)}
                  >
                    {executorOptions.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={pending || !executorPick}
                    onClick={() =>
                      run("assign", () =>
                        adminAssignExecutorAction({ orderId, executorUserId: executorPick }),
                      )
                    }
                  >
                    Назначить
                  </Button>
                </>
              )}
              {snapshot.status === "ASSIGNED" &&
              snapshot.executorId &&
              snapshot.paymentStatus === "RESERVED" &&
              !snapshot.hasActiveDispute ? (
                <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Пока исполнитель не начал работу, можно снять назначение: заказ вернётся в поиск, отклики
                    восстановятся, резерв средств сохранится.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    disabled={pending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Снять исполнителя с заказа? Заказ снова станет открытым для откликов.",
                        )
                      ) {
                        return;
                      }
                      run("admin-unassign", () => adminUnassignExecutorAction({ orderId }));
                    }}
                  >
                    Снять исполнителя
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Статус (ручная смена)</Label>
              <div className="flex flex-wrap gap-2">
                <select
                  className="flex h-10 min-w-[200px] flex-1 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                  value={adminStatus}
                  onChange={(e) => setAdminStatus(e.target.value as OrderStatus)}
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Комментарий в историю"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="min-w-[200px] flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run("status", () =>
                      adminSetOrderStatusAction({
                        orderId,
                        status: adminStatus,
                        note: adminNote || undefined,
                      }),
                    )
                  }
                >
                  Применить статус
                </Button>
              </div>
            </div>
          </div>

          {snapshot.status === "PUBLISHED" &&
          snapshot.visibilityType === "OPEN_FOR_RESPONSES" &&
          !snapshot.executorId ? (
            <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <h3 className="text-sm font-medium">Отклики</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Принять отклик можно только если у заказа в статусе оплаты указано, что сумма зарезервирована под заказ
                (безопасная сделка).
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {snapshot.proposals
                  .filter((p) => p.status === "PENDING")
                  .map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-100 px-3 py-2 dark:border-neutral-900"
                    >
                      <span>
                        {p.label}
                        {p.offeredCents != null
                          ? ` · ${formatMoneyFromCents(p.offeredCents)}`
                          : ""}
                        {p.offeredDays != null ? ` · ${p.offeredDays} дн.` : ""}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run("accept", () => adminAcceptProposalAction({ proposalId: p.id }))
                        }
                      >
                        Принять отклик
                      </Button>
                    </li>
                  ))}
                {snapshot.proposals.filter((p) => p.status === "PENDING").length === 0 ? (
                  <li className="text-neutral-500">Нет активных откликов</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {viewerRole === "CUSTOMER" &&
      snapshot.customerPartnerUserIds.includes(viewerId) &&
      snapshot.customerId !== viewerId ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold">Вы — соучастник заказа</h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            Основной заказчик управляет резервом суммы под заказ, выбором исполнителя и статусами. У вас есть доступ к
            карточке и чату, чтобы быть в контексте сделки.
          </p>
        </section>
      ) : null}

      {viewerRole === "CUSTOMER" && snapshot.customerId === viewerId ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <OrderCustomerPartnersManage orderId={orderId} partners={snapshot.customerPartnersListed} />
          <h2 className="text-sm font-semibold">Действия заказчика</h2>
          <p className="mt-2 text-xs text-neutral-500">
            {PAYMENT_STATUS_LABELS[snapshot.paymentStatus]} · бюджет{" "}
            {formatMoneyFromCents(snapshot.budgetCents, snapshot.currency)}
          </p>
          {snapshot.paymentStatus === "UNPAID" &&
          !["CANCELED", "COMPLETED", "DRAFT"].includes(snapshot.status) ? (
            <div className="mt-3 rounded-md border border-dashed border-amber-300/80 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                Сумма заказа резервируется с вашего баланса под этот заказ: исполнитель не получит её до вашей приёмки
                результата. Пока исполнитель не назначен, при отмене заказа резерв снова доступен на балансе.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-2"
                disabled={pending}
                onClick={() =>
                  run("reserve", () => customerReserveOrderAction({ orderId }))
                }
              >
                Зарезервировать {formatMoneyFromCents(snapshot.budgetCents, snapshot.currency)} под заказ
              </Button>
            </div>
          ) : null}
          {snapshot.paymentStatus === "RESERVED" ? (
            <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200/90">
              Сумма зарезервирована под этот заказ до приёмки работы или возврата по правилам заказа.
            </p>
          ) : null}
          {snapshot.status === "ASSIGNED" &&
          snapshot.executorId &&
          snapshot.paymentStatus === "RESERVED" &&
          !snapshot.hasActiveDispute ? (
            <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                Пока исполнитель не нажал «Начать работу», вы можете снять назначение: заказ снова появится в поиске,
                отклики вернутся в ожидание, резерв под заказ сохранится.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      "Снять исполнителя с заказа? Заказ снова станет доступен для откликов, вы сможете выбрать другого исполнителя.",
                    )
                  ) {
                    return;
                  }
                  run("unassign", () => customerUnassignExecutorAction({ orderId }));
                }}
              >
                Снять исполнителя
              </Button>
            </div>
          ) : null}
          {snapshot.status === "PUBLISHED" &&
          snapshot.visibilityType === "OPEN_FOR_RESPONSES" &&
          !snapshot.executorId ? (
            <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Отклики</h3>
              {snapshot.paymentStatus === "RESERVED" ? (
                <>
                  <p className="mt-1 text-xs text-neutral-500">
                    Выберите исполнителя по одному из откликов. Остальные отклики будут отклонены автоматически.
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {snapshot.proposals
                      .filter((p) => p.status === "PENDING")
                      .map((p) => (
                        <li
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-100 px-3 py-2 dark:border-neutral-900"
                        >
                          <span>
                            {p.label}
                            {p.offeredCents != null
                              ? ` · ${formatMoneyFromCents(p.offeredCents)}`
                              : ""}
                            {p.offeredDays != null ? ` · ${p.offeredDays} дн.` : ""}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              run("pick", () => customerAcceptProposalAction({ proposalId: p.id }))
                            }
                          >
                            Выбрать исполнителем
                          </Button>
                        </li>
                      ))}
                    {snapshot.proposals.filter((p) => p.status === "PENDING").length === 0 ? (
                      <li className="text-neutral-500">Пока нет откликов — дождитесь исполнителей.</li>
                    ) : null}
                  </ul>
                </>
              ) : (
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/90">
                  Чтобы выбрать исполнителя, сначала зарезервируйте сумму заказа (кнопка выше) — так исполнитель
                  получит оплату только после приёмки работы.
                </p>
              )}
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {["NEW", "ON_MODERATION", "PUBLISHED"].includes(snapshot.status) &&
            !snapshot.executorId ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => run("cancel", () => customerCancelOrderAction({ orderId }))}
              >
                Отменить заказ
              </Button>
            ) : null}
            {canCustomerDeleteOrderSnapshot(snapshot) ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                disabled={pending}
                onClick={() => {
                  if (
                    !window.confirm(
                      "Удалить заказ безвозвратно? Отклики и переписка по заказу будут удалены. Если сумма была зарезервирована под заказ, она вернётся на ваш баланс.",
                    )
                  ) {
                    return;
                  }
                  setMsg(null);
                  startTransition(async () => {
                    const r = await customerDeleteOrderAction({ orderId });
                    if (!r.ok) {
                      setMsg(r.error ?? "Не удалось удалить");
                      return;
                    }
                    router.push("/customer/orders");
                  });
                }}
              >
                Удалить заказ
              </Button>
            ) : null}
            {snapshot.status === "SUBMITTED" ? (
              <div className="w-full space-y-2">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Исполнитель сдал результат. Если всё устраивает, завершите заказ — зарезервированная сумма пойдёт
                  исполнителю по правилам сделки. Иначе отправьте на доработку.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || snapshot.paymentStatus !== "RESERVED"}
                    onClick={() => run("accept", () => customerAcceptWorkAction({ orderId }))}
                  >
                    Завершить заказ
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run("revision", () => customerRequestRevisionAction({ orderId }))}
                  >
                    На доработку
                  </Button>
                </div>
                {snapshot.paymentStatus !== "RESERVED" ? (
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    Чтобы завершить заказ, сначала зарезервируйте сумму под заказ (блок «бюджет» выше).
                  </p>
                ) : null}
              </div>
            ) : null}
            {snapshot.status === "ACCEPTED" && !snapshot.hasActiveDispute ? (
              <div className="mt-3 w-full space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Работа принята. При желании окончательно закройте заказ в системе — статус станет «Завершён» (деньги уже
                  учтены по сделке).
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => run("complete", () => customerCompleteOrderAction({ orderId }))}
                >
                  Закрыть заказ
                </Button>
              </div>
            ) : null}
          </div>
          {snapshot.hasActiveDispute ? (
            <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
              По заказу рассматривается спор. Ожидайте решения администрации.
            </p>
          ) : null}
          {snapshot.canOpenDispute ? (
            <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Спор</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Опишите проблему — заказ перейдёт в статус «Спор», администратор получит уведомление.
              </p>
              <div className="mt-2 space-y-2">
                <Textarea
                  placeholder="Суть спора (не менее 10 символов)"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  disabled={pending}
                  className="min-h-[100px]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run("dispute", () => openDisputeAction({ orderId, reason: disputeReason }))
                  }
                >
                  Открыть спор
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {viewerRole === "EXECUTOR" ? (
        <section
          id="executor-respond"
          className="scroll-mt-24 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <h2 className="text-sm font-semibold">Действия исполнителя</h2>
          {canPropose ? (
            <form
              className="mt-3 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                run("proposal", () =>
                  executorCreateProposalAction({
                    orderId,
                    offeredRubles: offerRub === "" ? undefined : Number(offerRub),
                    offeredDays: offerDays === "" ? undefined : Number(offerDays),
                    message: offerMsg || undefined,
                  }),
                );
              }}
            >
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Откликнуться на заказ</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="offRub">Цена (₽), опц.</Label>
                  <Input
                    id="offRub"
                    type="number"
                    min={1}
                    value={offerRub}
                    onChange={(e) => setOfferRub(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="offDays">Срок (дней), опц.</Label>
                  <Input
                    id="offDays"
                    type="number"
                    min={1}
                    value={offerDays}
                    onChange={(e) =>
                      setOfferDays(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="offMsg">Сообщение</Label>
                <Textarea id="offMsg" value={offerMsg} onChange={(e) => setOfferMsg(e.target.value)} />
              </div>
              <Button type="submit" size="sm" disabled={pending}>
                Отправить отклик
              </Button>
            </form>
          ) : null}

          {snapshot.executorId === viewerId ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              {snapshot.status === "ASSIGNED" && snapshot.paymentStatus === "UNPAID" ? (
                <p className="w-full text-sm text-amber-800 dark:text-amber-200">
                  Заказчик ещё не зарезервировал сумму под безопасную сделку. Кнопка «Начать работу» станет доступна,
                  когда сумма будет зарезервирована под этот заказ.
                </p>
              ) : null}
              {snapshot.status === "ASSIGNED" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || snapshot.paymentStatus !== "RESERVED"}
                  onClick={() => run("start", () => executorStartWorkAction({ orderId }))}
                >
                  Начать работу
                </Button>
              ) : null}
              {snapshot.status === "IN_PROGRESS" || snapshot.status === "REVISION" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => run("submit", () => executorSubmitWorkAction({ orderId }))}
                >
                  Сдать результат
                </Button>
              ) : null}
              {snapshot.status === "SUBMITTED" ? (
                <p className="w-full text-xs text-neutral-600 dark:text-neutral-400">
                  Результат сдан — ожидайте, пока заказчик завершит заказ или запросит доработку.
                </p>
              ) : null}
              {snapshot.status === "ACCEPTED" && !snapshot.hasActiveDispute ? (
                <div className="w-full space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Работа принята заказчиком. Вы можете окончательно закрыть заказ в системе — статус станет «Завершён».
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => run("ex-complete", () => executorCompleteOrderAction({ orderId }))}
                  >
                    Закрыть заказ
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
          {snapshot.hasActiveDispute && snapshot.executorId === viewerId ? (
            <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
              По заказу рассматривается спор. Ожидайте решения администрации.
            </p>
          ) : null}
          {snapshot.canOpenDispute && snapshot.executorId === viewerId ? (
            <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Спор</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Опишите проблему — заказ перейдёт в статус «Спор», администратор получит уведомление.
              </p>
              <div className="mt-2 space-y-2">
                <Textarea
                  placeholder="Суть спора (не менее 10 символов)"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  disabled={pending}
                  className="min-h-[100px]"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run("dispute", () => openDisputeAction({ orderId, reason: disputeReason }))
                  }
                >
                  Открыть спор
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
