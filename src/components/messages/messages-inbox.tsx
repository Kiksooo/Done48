import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";
import type { ChatInboxRow } from "@/server/queries/chat-inbox";

export function MessagesInboxList({ rows }: { rows: ChatInboxRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Пока нет чатов. Сообщения ведутся в карточке заказа — после первого сообщения диалог появится здесь.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
      {rows.map((row) => (
        <li key={row.orderId}>
          <Link
            href={`/orders/${row.orderId}`}
            className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.orderTitle}</span>
                <Badge variant="outline" className="text-xs">
                  {ORDER_STATUS_LABELS[row.orderStatus as keyof typeof ORDER_STATUS_LABELS] ?? row.orderStatus}
                </Badge>
                {row.unreadCount > 0 ? (
                  <Badge variant="default" className="text-xs">
                    {row.unreadCount > 99 ? "99+" : row.unreadCount} новых
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{row.lastPreview}</p>
            </div>
            <time
              className="shrink-0 text-xs text-neutral-500"
              dateTime={row.lastAt.toISOString()}
              suppressHydrationWarning
            >
              {formatDateTime(row.lastAt)}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}
