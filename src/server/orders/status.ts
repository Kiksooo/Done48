import type { OrderStatus, Prisma } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/order-labels";

type Tx = Prisma.TransactionClient;

export async function appendStatusHistory(
  tx: Tx,
  params: {
    orderId: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    actorUserId?: string | null;
    note?: string | null;
  },
) {
  await tx.orderStatusHistory.create({
    data: {
      orderId: params.orderId,
      fromStatus: params.fromStatus ?? undefined,
      toStatus: params.toStatus,
      actorUserId: params.actorUserId ?? undefined,
      note: params.note ?? undefined,
    },
  });

  const chat = await tx.chat.findUnique({ where: { orderId: params.orderId } });
  if (!chat) return;

  const fromLabel = params.fromStatus
    ? ORDER_STATUS_LABELS[params.fromStatus]
    : "—";
  const toLabel = ORDER_STATUS_LABELS[params.toStatus];
  let body = `Статус заказа: ${fromLabel} → ${toLabel}`;
  if (params.note?.trim()) {
    body += `. ${params.note.trim()}`;
  }

  await tx.chatMessage.create({
    data: {
      chatId: chat.id,
      kind: "SYSTEM",
      body,
    },
  });
}
