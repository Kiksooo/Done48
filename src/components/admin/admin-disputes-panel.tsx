"use client";

import type { DisputeStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { adminUpdateDisputeAction } from "@/server/actions/disputes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { DISPUTE_STATUS_LABELS } from "@/lib/dispute-labels";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";

const ALL: DisputeStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED_CUSTOMER",
  "RESOLVED_EXECUTOR",
  "PARTIAL",
  "CLOSED",
];

export type AdminDisputeRow = {
  id: string;
  status: DisputeStatus;
  reason: string;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  orderTitle: string;
  orderStatus: string;
  openedByEmail: string;
};

export function AdminDisputesPanel({ rows }: { rows: AdminDisputeRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-neutral-600 dark:text-neutral-400">Споров пока нет.</p>;
  }

  return (
    <ul className="space-y-6">
      {rows.map((row) => (
        <DisputeCard key={row.id} row={row} />
      ))}
    </ul>
  );
}

function DisputeCard({ row }: { row: AdminDisputeRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<DisputeStatus>(row.status);
  const [resolution, setResolution] = useState(row.resolution ?? "");

  useEffect(() => {
    setStatus(row.status);
    setResolution(row.resolution ?? "");
  }, [row.status, row.resolution]);

  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      {msg ? (
        <p className="mb-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`/orders/${row.orderId}`}
            className="font-medium text-neutral-900 underline hover:no-underline dark:text-neutral-100"
          >
            {row.orderTitle}
          </Link>
          <p className="mt-1 text-xs text-neutral-500">
            Заказ: {ORDER_STATUS_LABELS[row.orderStatus as keyof typeof ORDER_STATUS_LABELS] ?? row.orderStatus} ·
            открыл: {row.openedByEmail}
          </p>
          <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{row.reason}</p>
        </div>
        <div className="text-xs text-neutral-500">
          <div>{formatDateTime(row.createdAt)}</div>
          <div>обн. {formatDateTime(row.updatedAt)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 border-t border-neutral-100 pt-4 dark:border-neutral-900 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`st-${row.id}`}>Статус спора</Label>
          <select
            id={`st-${row.id}`}
            className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
            value={status}
            onChange={(e) => setStatus(e.target.value as DisputeStatus)}
            disabled={pending}
          >
            {ALL.map((s) => (
              <option key={s} value={s}>
                {DISPUTE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`res-${row.id}`}>Решение / комментарий админа</Label>
          <Textarea
            id={`res-${row.id}`}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            disabled={pending}
            className="min-h-[80px]"
          />
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          startTransition(async () => {
            const r = await adminUpdateDisputeAction({
              disputeId: row.id,
              status,
              resolution: resolution.trim() || null,
            });
            if (!r.ok) {
              setMsg(r.error ?? "Ошибка");
              return;
            }
            router.refresh();
          });
        }}
      >
        Сохранить
      </Button>
    </li>
  );
}
