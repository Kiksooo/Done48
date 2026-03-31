"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
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
};

export function NotificationInbox({ items, hideHeading = false }: NotificationInboxProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function openItem(item: NotificationInboxItem) {
    startTransition(async () => {
      await markNotificationReadAction(item.id);
      if (item.link) router.push(item.link);
      else router.refresh();
    });
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
        <p className="text-sm text-muted-foreground">Пока нет уведомлений.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => openItem(item)}
                className={cn(
                  "flex w-full flex-col gap-1 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/60",
                  !item.readAt && "bg-muted/40",
                )}
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
                  <p className="line-clamp-2 text-muted-foreground">{item.body}</p>
                ) : null}
                {item.link ? (
                  <span className="text-xs text-muted-foreground">Открыть заказ или страницу →</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
