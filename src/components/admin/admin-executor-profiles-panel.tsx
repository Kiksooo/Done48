"use client";

import type { ExecutorAccountStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { adminSetExecutorAccountStatusAction } from "@/server/actions/admin-executor-profiles";

export type ExecutorProfileAdminRow = {
  userId: string;
  email: string;
  isActive: boolean;
  displayName: string | null;
  username: string | null;
  city: string | null;
  accountStatus: ExecutorAccountStatus;
  verificationStatus: string;
  userCreatedAt: string;
  updatedAt: string;
};

function statusLabel(s: ExecutorAccountStatus): string {
  switch (s) {
    case "PENDING_MODERATION":
      return "На модерации";
    case "ACTIVE":
      return "Активен";
    case "BLOCKED":
      return "Заблокирован";
    case "ARCHIVED":
      return "Архив";
    default:
      return s;
  }
}

function statusVariant(s: ExecutorAccountStatus): "warning" | "success" | "danger" | "secondary" {
  switch (s) {
    case "PENDING_MODERATION":
      return "warning";
    case "ACTIVE":
      return "success";
    case "BLOCKED":
      return "danger";
    default:
      return "secondary";
  }
}

function sortWeight(s: ExecutorAccountStatus): number {
  switch (s) {
    case "PENDING_MODERATION":
      return 0;
    case "ACTIVE":
      return 1;
    case "BLOCKED":
      return 2;
    case "ARCHIVED":
      return 3;
    default:
      return 9;
  }
}

export function AdminExecutorProfilesPanel({ rows }: { rows: ExecutorProfileAdminRow[] }) {
  const ordered = [...rows].sort((a, b) => {
    const d = sortWeight(a.accountStatus) - sortWeight(b.accountStatus);
    if (d !== 0) return d;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (ordered.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 px-4 py-8 text-center text-sm text-neutral-500 dark:border-neutral-800">
        Нет исполнителей в базе.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
          <tr>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Имя / username</th>
            <th className="px-3 py-2 font-medium">Город</th>
            <th className="px-3 py-2 font-medium">Аккаунт</th>
            <th className="px-3 py-2 font-medium">Верификация</th>
            <th className="px-3 py-2 font-medium">Регистрация</th>
            <th className="px-3 py-2 font-medium">Действия</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((r) => (
            <ExecutorProfileRow key={r.userId} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExecutorProfileRow({ row }: { row: ExecutorProfileAdminRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function setStatus(status: ExecutorAccountStatus) {
    const r = await adminSetExecutorAccountStatusAction({ userId: row.userId, status });
    if (!r.ok) {
      window.alert(r.error ?? "Ошибка");
      return;
    }
    router.refresh();
  }

  return (
    <tr className="border-b border-neutral-100 dark:border-neutral-900">
      <td className="px-3 py-2">
        <div className="font-medium">{row.email}</div>
        {!row.isActive ? <p className="text-xs text-amber-700 dark:text-amber-400">Вход отключён (User)</p> : null}
      </td>
      <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">
        {row.displayName ?? "—"}
        {row.username ? <span className="block text-xs text-neutral-500">@{row.username}</span> : null}
      </td>
      <td className="px-3 py-2 text-neutral-600">{row.city ?? "—"}</td>
      <td className="px-3 py-2">
        <Badge variant={statusVariant(row.accountStatus)}>{statusLabel(row.accountStatus)}</Badge>
      </td>
      <td className="px-3 py-2 text-xs text-neutral-600">{row.verificationStatus}</td>
      <td className="px-3 py-2 text-neutral-600">{formatDateTime(row.userCreatedAt)}</td>
      <td className="px-3 py-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap">
          {row.accountStatus !== "ACTIVE" ? (
            <Button
              type="button"
              size="sm"
              className="h-8"
              disabled={pending}
              onClick={() => startTransition(() => setStatus("ACTIVE"))}
            >
              Одобрить
            </Button>
          ) : null}
          {row.accountStatus !== "PENDING_MODERATION" && row.accountStatus !== "ARCHIVED" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              disabled={pending}
              onClick={() => startTransition(() => setStatus("PENDING_MODERATION"))}
            >
              На проверку
            </Button>
          ) : null}
          {row.accountStatus !== "BLOCKED" && row.accountStatus !== "ARCHIVED" ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-8"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Заблокировать аккаунт исполнителя ${row.email}?`)) return;
                startTransition(() => setStatus("BLOCKED"));
              }}
            >
              Заблокировать
            </Button>
          ) : row.accountStatus === "BLOCKED" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              disabled={pending}
              onClick={() => startTransition(() => setStatus("PENDING_MODERATION"))}
            >
              Разблокировать
            </Button>
          ) : null}
          {row.accountStatus !== "ARCHIVED" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Отправить ${row.email} в архив? Отклики будут недоступны.`)) return;
                startTransition(() => setStatus("ARCHIVED"));
              }}
            >
              В архив
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              disabled={pending}
              onClick={() => startTransition(() => setStatus("PENDING_MODERATION"))}
            >
              Из архива
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
