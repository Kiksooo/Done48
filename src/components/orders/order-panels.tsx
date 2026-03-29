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
import { adminAcceptProposalAction, adminAssignExecutorAction, adminPublishOrder, adminSetOrderStatusAction } from "@/server/actions/orders/admin-orders";
import { customerAcceptWorkAction, customerCancelOrderAction, customerRequestRevisionAction } from "@/server/actions/orders/customer-orders";
import {
  executorCreateProposalAction,
  executorStartWorkAction,
  executorSubmitWorkAction,
} from "@/server/actions/orders/executor-orders";
import { openDisputeAction } from "@/server/actions/disputes";

type ProposalRow = {
  id: string;
  status: ProposalStatus;
  executorId: string;
  label: string;
  offeredCents: number | null;
  offeredDays: number | null;
};

type ExecutorOption = { id: string; label: string };

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
                Безопасная сделка: назначение возможно только после того, как заказчик заблокировал сумму заказа с
                баланса.
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
                Принять отклик можно только если у заказа статус платежа «средства в безопасной сделке».
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

      {viewerRole === "CUSTOMER" && snapshot.customerId === viewerId ? (
        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold">Действия заказчика</h2>
          <p className="mt-2 text-xs text-neutral-500">
            {PAYMENT_STATUS_LABELS[snapshot.paymentStatus]} · бюджет{" "}
            {formatMoneyFromCents(snapshot.budgetCents, snapshot.currency)}
          </p>
          {snapshot.paymentStatus === "UNPAID" &&
          !["CANCELED", "COMPLETED", "DRAFT"].includes(snapshot.status) ? (
            <div className="mt-3 rounded-md border border-dashed border-amber-300/80 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Как на Авито</p>
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                Сумма заказа списывается с вашего баланса и удерживается на площадке. Исполнитель получит деньги только
                после того, как вы примете работу. До этого средства можно вернуть при отмене заказа без назначенного
                исполнителя.
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
                Заблокировать {formatMoneyFromCents(snapshot.budgetCents, snapshot.currency)} в сделке
              </Button>
            </div>
          ) : null}
          {snapshot.paymentStatus === "RESERVED" ? (
            <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200/90">
              Сумма заблокирована на площадке до приёмки работы или возврата по правилам заказа.
            </p>
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
            {snapshot.status === "SUBMITTED" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => run("accept", () => customerAcceptWorkAction({ orderId }))}
                >
                  Принять работу
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
              </>
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
        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
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
                  Заказчик ещё не внёс сумму в безопасную сделку. Кнопка «Начать работу» станет доступна после
                  блокировки средств на площадке.
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
