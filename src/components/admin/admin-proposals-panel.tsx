"use client";

import type { OrderStatus, ProposalStatus, VisibilityType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminAcceptProposalAction } from "@/server/actions/orders/admin-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";

export type AdminProposalListRow = {
  id: string;
  status: ProposalStatus;
  createdAt: string;
  offeredCents: number | null;
  offeredDays: number | null;
  message: string | null;
  executorEmail: string;
  orderId: string;
  orderTitle: string;
  orderStatus: OrderStatus;
  visibilityType: VisibilityType;
  orderExecutorId: string | null;
  customerEmail: string;
};

const STATUS_LABELS: Record<ProposalStatus, string> = {
  PENDING: "Ожидает",
  ACCEPTED: "Принят",
  REJECTED: "Отклонён",
  WITHDRAWN: "Отозван",
};

function canAccept(row: AdminProposalListRow): boolean {
  return (
    row.status === "PENDING" &&
    row.orderStatus === "PUBLISHED" &&
    row.visibilityType === "OPEN_FOR_RESPONSES" &&
    row.orderExecutorId === null
  );
}

function ProposalTable({
  rows,
  showAccept,
}: {
  rows: AdminProposalListRow[];
  showAccept: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function accept(id: string) {
    setMsg(null);
    startTransition(async () => {
      const r = await adminAcceptProposalAction({ proposalId: id });
      if (!r.ok) {
        setMsg(r.error ?? "Ошибка");
        return;
      }
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Нет записей.</p>;
  }

  return (
    <div className="space-y-2">
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
            <tr>
              <th className="px-3 py-2 font-medium">Заказ</th>
              <th className="px-3 py-2 font-medium">Специалист</th>
              <th className="px-3 py-2 font-medium">Условия</th>
              <th className="px-3 py-2 font-medium">Статус</th>
              <th className="px-3 py-2 font-medium">Дата</th>
              {showAccept ? <th className="px-3 py-2 font-medium">Действие</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="px-3 py-2 align-top">
                  <Link
                    href={`/orders/${row.orderId}`}
                    className="font-medium text-neutral-900 underline hover:no-underline dark:text-neutral-100"
                  >
                    {row.orderTitle}
                  </Link>
                  <p className="mt-0.5 text-xs text-neutral-500">Заказчик: {row.customerEmail}</p>
                  {!canAccept(row) && row.status === "PENDING" ? (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Принятие недоступно: проверьте статус заказа и тип назначения на карточке заказа.
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-top text-neutral-700 dark:text-neutral-300">
                  {row.executorEmail}
                </td>
                <td className="px-3 py-2 align-top text-neutral-600 dark:text-neutral-400">
                  {row.offeredCents != null ? (
                    <span>{formatMoneyFromCents(row.offeredCents)}</span>
                  ) : (
                    <span>—</span>
                  )}
                  {row.offeredDays != null ? (
                    <span className="block text-xs">Срок: {row.offeredDays} дн.</span>
                  ) : null}
                  {row.message ? (
                    <p className="mt-1 max-w-xs text-xs text-neutral-500 line-clamp-3">{row.message}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-top">
                  <Badge variant={row.status === "PENDING" ? "warning" : "secondary"}>
                    {STATUS_LABELS[row.status]}
                  </Badge>
                </td>
                <td className="px-3 py-2 align-top text-neutral-600">{formatDateTime(row.createdAt)}</td>
                {showAccept ? (
                  <td className="px-3 py-2 align-top">
                    {row.status === "PENDING" && canAccept(row) ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => accept(row.id)}
                      >
                        Принять
                      </Button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminProposalsPanel(props: {
  pending: AdminProposalListRow[];
  resolved: AdminProposalListRow[];
}) {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ожидают решения</h2>
        <ProposalTable rows={props.pending} showAccept />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Недавно обработанные</h2>
        <ProposalTable rows={props.resolved} showAccept={false} />
      </section>
    </div>
  );
}
