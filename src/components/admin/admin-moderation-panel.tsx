"use client";

import type { ContactBlocklistKind, UserReportCategory, UserReportStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import { CONTACT_BLOCKLIST_KIND_LABELS } from "@/lib/user-labels";
import {
  adminAddContactBlocklistAction,
  adminRemoveContactBlocklistAction,
  adminSetUserActiveAction,
  adminUpdateUserReportAction,
} from "@/server/actions/admin-trust";
import {
  adminApprovePortfolioItemAction,
  adminRejectPortfolioItemAction,
} from "@/server/actions/admin-portfolio-moderation";

const CAT_RU: Record<UserReportCategory, string> = {
  SCAM: "Обман",
  HARASSMENT: "Давление",
  FAKE_IDENTITY: "Фейк",
  SPAM: "Спам",
  OTHER: "Другое",
};

const STATUS_LABELS: Record<UserReportStatus, string> = {
  OPEN: "Новая",
  IN_REVIEW: "В работе",
  RESOLVED: "Решена",
  DISMISSED: "Отклонена",
};

export type ModerationReportRow = {
  id: string;
  category: UserReportCategory;
  description: string;
  status: UserReportStatus;
  adminNote: string | null;
  createdAt: string;
  reporterEmail: string;
  targetUserId: string;
  targetEmail: string;
  targetActive: boolean;
  orderId: string | null;
  orderTitle: string | null;
};

export type BlocklistRow = {
  id: string;
  kind: ContactBlocklistKind;
  valueNorm: string;
  reason: string | null;
  createdAt: string;
  createdByEmail: string | null;
};

export type PortfolioModerationQueueRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  updatedAt: string;
  executorEmail: string;
  executorUsername: string | null;
  executorDisplayName: string | null;
};

export function AdminModerationPanel(props: {
  reports: ModerationReportRow[];
  blocklist: BlocklistRow[];
  portfolioQueue: PortfolioModerationQueueRow[];
  portfolioQueueError?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"reports" | "blocklist" | "portfolio">("reports");
  const [blKind, setBlKind] = useState<ContactBlocklistKind>("EMAIL");
  const [blValue, setBlValue] = useState("");
  const [blReason, setBlReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "reports" ? "bg-primary text-primary-foreground" : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"}`}
          onClick={() => setTab("reports")}
        >
          Жалобы ({props.reports.filter((r) => r.status === "OPEN").length} открытых)
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "blocklist" ? "bg-primary text-primary-foreground" : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"}`}
          onClick={() => setTab("blocklist")}
        >
          Блоклист контактов
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === "portfolio" ? "bg-primary text-primary-foreground" : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"}`}
          onClick={() => setTab("portfolio")}
        >
          Галерея работ ({props.portfolioQueue.length})
        </button>
      </div>

      {tab === "reports" ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Связь со <Link href="/admin/disputes" className="underline">спорами по заказам</Link>: при серьёзном
            конфликте участники открывают спор; жалобы — для сигналов о нарушителях и мошенниках.
          </p>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Дата</th>
                  <th className="px-3 py-2 font-medium">Кто / на кого</th>
                  <th className="px-3 py-2 font-medium">Заказ</th>
                  <th className="px-3 py-2 font-medium">Суть</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {props.reports.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-900 align-top">
                    <td className="px-3 py-2 text-neutral-600">{formatDateTime(r.createdAt)}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs">
                        <span className="text-neutral-500">от </span>
                        {r.reporterEmail}
                      </div>
                      <div className="mt-1 text-xs">
                        <span className="text-neutral-500">на </span>
                        <span className={r.targetActive ? "" : "text-red-600 dark:text-red-400"}>
                          {r.targetEmail}
                          {!r.targetActive ? " (заблок.)" : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {r.orderId && r.orderTitle ? (
                        <Link href={`/orders/${r.orderId}`} className="text-primary underline-offset-2 hover:underline">
                          {r.orderTitle.slice(0, 40)}
                          {r.orderTitle.length > 40 ? "…" : ""}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-xs px-3 py-2">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">
                        {CAT_RU[r.category]}
                      </span>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-700 dark:text-neutral-300">
                        {r.description}
                      </p>
                      {r.adminNote ? (
                        <p className="mt-1 text-xs text-neutral-500">Заметка: {r.adminNote}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{STATUS_LABELS[r.status]}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-2">
                        <ReportStatusMiniForm
                          reportId={r.id}
                          current={r.status}
                          adminNoteInitial={r.adminNote}
                          disabled={pending}
                        />
                        {r.targetActive ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                setMsg(null);
                                const res = await adminSetUserActiveAction({
                                  userId: r.targetUserId,
                                  isActive: false,
                                });
                                if (!res.ok) setMsg(res.error ?? "Ошибка");
                                router.refresh();
                              })
                            }
                          >
                            Заблокировать контрагента
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                setMsg(null);
                                const res = await adminSetUserActiveAction({
                                  userId: r.targetUserId,
                                  isActive: true,
                                });
                                if (!res.ok) setMsg(res.error ?? "Ошибка");
                                router.refresh();
                              })
                            }
                          >
                            Разблокировать
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {props.reports.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500">Жалоб пока нет.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "blocklist" ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Заблокированные email нельзя использовать при регистрации. Телефон и Telegram — проверяются при сохранении
            профиля.
          </p>
          {msg ? (
            <p className="text-sm text-red-600" role="alert">
              {msg}
            </p>
          ) : null}
          <form
            className="max-w-md space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            onSubmit={(e) => {
              e.preventDefault();
              setMsg(null);
              startTransition(async () => {
                const res = await adminAddContactBlocklistAction({
                  kind: blKind,
                  value: blValue,
                  reason: blReason || null,
                });
                if (!res.ok) {
                  setMsg(res.error ?? "Ошибка");
                  return;
                }
                setBlValue("");
                setBlReason("");
                router.refresh();
              });
            }}
          >
            <div className="space-y-2">
              <Label>Тип</Label>
              <select
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                value={blKind}
                onChange={(e) => setBlKind(e.target.value as ContactBlocklistKind)}
              >
                <option value="EMAIL">{CONTACT_BLOCKLIST_KIND_LABELS.EMAIL}</option>
                <option value="PHONE">{CONTACT_BLOCKLIST_KIND_LABELS.PHONE}</option>
                <option value="TELEGRAM">{CONTACT_BLOCKLIST_KIND_LABELS.TELEGRAM}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blv">Значение</Label>
              <Input
                id="blv"
                value={blValue}
                onChange={(e) => setBlValue(e.target.value)}
                placeholder="user@mail.ru, +7999…, @username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blr">Причина (необязательно)</Label>
              <Input id="blr" value={blReason} onChange={(e) => setBlReason(e.target.value)} />
            </div>
            <Button type="submit" disabled={pending}>
              Добавить
            </Button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/40">
                <tr>
                  <th className="px-3 py-2 font-medium">Тип</th>
                  <th className="px-3 py-2 font-medium">Значение</th>
                  <th className="px-3 py-2 font-medium">Причина</th>
                  <th className="px-3 py-2 font-medium">Когда</th>
                  <th className="px-3 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {props.blocklist.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="px-3 py-2">{CONTACT_BLOCKLIST_KIND_LABELS[b.kind]}</td>
                    <td className="px-3 py-2 font-mono text-xs">{b.valueNorm}</td>
                    <td className="px-3 py-2 text-xs text-neutral-600">{b.reason ?? "—"}</td>
                    <td className="px-3 py-2 text-neutral-600">{formatDateTime(b.createdAt)}</td>
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 text-red-600"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            setMsg(null);
                            const res = await adminRemoveContactBlocklistAction({ entryId: b.id });
                            if (!res.ok) setMsg(res.error ?? "Ошибка");
                            router.refresh();
                          })
                        }
                      >
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {props.blocklist.length === 0 ? (
              <p className="p-4 text-sm text-neutral-500">Список пуст.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "portfolio" ? (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Фото из галереи специалистов на публичных страницах и в каталоге показываются только после одобрения здесь.
          </p>
          {props.portfolioQueueError ? (
            <p
              className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
              role="alert"
            >
              {props.portfolioQueueError}
            </p>
          ) : null}
          {msg ? (
            <p className="text-sm text-red-600" role="alert">
              {msg}
            </p>
          ) : null}
          <div className="space-y-6">
            {props.portfolioQueue.map((row) => (
              <PortfolioQueueCard key={row.id} row={row} pending={pending} setMsg={setMsg} router={router} />
            ))}
          </div>
          {props.portfolioQueue.length === 0 ? (
            <p className="text-sm text-neutral-500">Нет работ на проверке.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PortfolioQueueCard(props: {
  row: PortfolioModerationQueueRow;
  pending: boolean;
  setMsg: (s: string | null) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { row, pending, setMsg, router } = props;
  const [rejectNote, setRejectNote] = useState("");
  const [localPending, startTransition] = useTransition();
  const busy = pending || localPending;
  const name = row.executorDisplayName?.trim() || row.executorUsername || row.executorEmail;

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex flex-wrap gap-4">
        <div className="h-32 w-44 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
          {row.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-500">Нет фото</div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.title}</p>
          {row.description ? (
            <p className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">{row.description}</p>
          ) : null}
          {row.linkUrl ? (
            <p>
              <Link
                href={row.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                Ссылка на работу
              </Link>
            </p>
          ) : null}
          <p className="text-xs text-neutral-500">
            Специалист: {name}
            {row.executorUsername ? (
              <>
                {" "}
                ·{" "}
                <Link
                  href={`/u/${row.executorUsername}`}
                  className="text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  @{row.executorUsername}
                </Link>
              </>
            ) : null}
            <span className="text-neutral-400"> · {row.executorEmail}</span>
          </p>
          <p className="text-xs text-neutral-400">Обновлено: {formatDateTime(row.updatedAt)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor={`rej-${row.id}`} className="text-xs">
            Комментарий при отклонении (необязательно)
          </Label>
          <Input
            id={`rej-${row.id}`}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Кратко, почему не подходит"
            disabled={busy}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() =>
              startTransition(async () => {
                setMsg(null);
                const res = await adminApprovePortfolioItemAction({ itemId: row.id });
                if (!res.ok) setMsg(res.error ?? "Ошибка");
                router.refresh();
              })
            }
          >
            Одобрить
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              startTransition(async () => {
                setMsg(null);
                const res = await adminRejectPortfolioItemAction({
                  itemId: row.id,
                  note: rejectNote,
                });
                if (!res.ok) setMsg(res.error ?? "Ошибка");
                else setRejectNote("");
                router.refresh();
              })
            }
          >
            Отклонить
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReportStatusMiniForm(props: {
  reportId: string;
  current: UserReportStatus;
  adminNoteInitial: string | null;
  disabled: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<UserReportStatus>(props.current);
  const [note, setNote] = useState(props.adminNoteInitial ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <select
        className="h-8 rounded border border-neutral-300 bg-transparent px-2 text-xs dark:border-neutral-600"
        value={status}
        disabled={props.disabled || pending}
        onChange={(e) => setStatus(e.target.value as UserReportStatus)}
      >
        {(Object.keys(STATUS_LABELS) as UserReportStatus[]).map((k) => (
          <option key={k} value={k}>
            {STATUS_LABELS[k]}
          </option>
        ))}
      </select>
      <input
        type="text"
        className="h-8 rounded border border-neutral-300 bg-transparent px-2 text-xs dark:border-neutral-600"
        placeholder="Заметка модератора"
        value={note}
        disabled={props.disabled || pending}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-8 text-xs"
        disabled={props.disabled || pending}
        onClick={() =>
          startTransition(async () => {
            await adminUpdateUserReportAction({
              reportId: props.reportId,
              status,
              adminNote: note.trim() || null,
            });
            router.refresh();
          })
        }
      >
        Сохранить статус
      </Button>
    </div>
  );
}
