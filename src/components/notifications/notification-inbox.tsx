"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { CabinetEmptyState } from "@/components/cabinet/dashboard-ui";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/actions/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NotificationInboxItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationInboxProps = {
  items: NotificationInboxItem[];
  /** Заголовок страницы снаружи (например, `CabinetPageHeader`). */
  hideHeading?: boolean;
  /** Показывать инструменты админа: раскрыть и скопировать. */
  enableDetailsTools?: boolean;
  /** Кнопка в пустом состоянии (например, к заказам). */
  emptyCta?: { href: string; label: string };
};

export function NotificationInbox({
  items,
  hideHeading = false,
  enableDetailsTools = false,
  emptyCta,
}: NotificationInboxProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function openItem(item: NotificationInboxItem) {
    startTransition(async () => {
      await markNotificationReadAction(item.id);
      if (item.link) router.push(item.link);
      else router.refresh();
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function copyItem(item: NotificationInboxItem) {
    const text = [item.title, item.body ?? "", item.link ?? ""].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((curr) => (curr === item.id ? null : curr));
      }, 1500);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex flex-wrap items-center gap-3",
          hideHeading ? "justify-end" : "justify-between",
        )}
      >
        {!hideHeading ? <h1 className="text-xl font-semibold tracking-tight">Уведомления</h1> : null}
        {items.some((i) => !i.readAt) ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markAllNotificationsReadAction();
                router.refresh();
              })
            }
          >
            Прочитать все
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <CabinetEmptyState
          icon={Bell}
          title="Пока без уведомлений"
          description="Когда появятся отклики, смены статуса заказа или сообщения от платформы, они отобразятся здесь. Важные события дублируем в разделе заказа."
        >
          {emptyCta ? (
            <Button type="button" size="sm" asChild>
              <Link href={emptyCta.href}>{emptyCta.label}</Link>
            </Button>
          ) : null}
        </CabinetEmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
          {items.map((item) => (
            <li key={item.id}>
              <div
                className={cn("flex flex-col gap-1 px-4 py-3 text-sm", !item.readAt && "bg-muted/40")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={item.createdAt}
                    suppressHydrationWarning
                  >
                    {new Date(item.createdAt).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                {item.body ? (
                  <p className={cn("text-muted-foreground", expandedIds[item.id] ? "whitespace-pre-wrap" : "line-clamp-2")}>
                    {item.body}
                  </p>
                ) : null}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {item.link ? (
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => openItem(item)}>
                      Открыть
                    </Button>
                  ) : null}
                  {enableDetailsTools && item.body ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => toggleExpanded(item.id)}>
                      {expandedIds[item.id] ? "Свернуть" : "Развернуть"}
                    </Button>
                  ) : null}
                  {enableDetailsTools ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => copyItem(item)}>
                      {copiedId === item.id ? "Скопировано" : "Копировать"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
