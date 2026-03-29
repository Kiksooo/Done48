import type { Role } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderChat } from "@/components/orders/order-chat";
import { OrderPanels } from "@/components/orders/order-panels";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { countUnreadChatMessages } from "@/lib/chat-unread";
import { formatDateTime, formatMoneyFromCents } from "@/lib/format";
import {
  BUDGET_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  VISIBILITY_LABELS,
} from "@/lib/order-labels";
import { getSessionUserForAction } from "@/lib/rbac";
import { assertOrderReadable } from "@/server/orders/access";
import { ensureChatMembership, getChatMessagesForOrder } from "@/server/queries/chat";
import { getOrderDetailForPage, listExecutorsForSelect } from "@/server/queries/orders";
import { prisma } from "@/lib/db";
import { getDisputeOpenFlagsForOrder } from "@/server/queries/disputes";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const user = await getSessionUserForAction();
  if (!user) notFound();

  const access = await assertOrderReadable({
    orderId: id,
    userId: user.id,
    role: user.role as Role,
  });
  if (!access.ok) notFound();

  const order = await getOrderDetailForPage(id);
  if (!order) notFound();

  await ensureChatMembership({
    orderId: order.id,
    userId: user.id,
    role: user.role as Role,
    customerId: order.customerId,
    executorId: order.executorId,
  });

  const chatData = await getChatMessagesForOrder(order.id);
  const myMembership = chatData?.members.find((m) => m.userId === user.id);
  const hasMembership = Boolean(chatData?.members.some((m) => m.userId === user.id));
  const unreadCount =
    chatData && hasMembership
      ? countUnreadChatMessages(chatData.messages, user.id, myMembership?.lastReadAt ?? null)
      : 0;

  const chatMessages = (chatData?.messages ?? []).map((m) => ({
    id: m.id,
    kind: m.kind,
    body: m.body,
    attachmentUrl: m.attachmentUrl,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
    senderEmail: m.sender?.email ?? null,
  }));

  const canPostToChat =
    user.role === "ADMIN" ||
    order.customerId === user.id ||
    (order.executorId !== null && order.executorId === user.id);

  const executorOptions =
    user.role === "ADMIN"
      ? (await listExecutorsForSelect()).map((e) => ({
          id: e.id,
          label: e.executorProfile?.displayName ?? e.executorProfile?.username ?? e.email,
        }))
      : [];

  let canPropose = false;
  if (user.role === "EXECUTOR") {
    const existing = await prisma.proposal.findFirst({
      where: { orderId: order.id, executorId: user.id },
    });
    canPropose =
      !existing &&
      order.status === "PUBLISHED" &&
      order.visibilityType === "OPEN_FOR_RESPONSES" &&
      order.executorId === null;
  }

  const disputeFlags = await getDisputeOpenFlagsForOrder(order.id, order.status);

  const proposals = order.proposals.map((p) => ({
    id: p.id,
    status: p.status,
    executorId: p.executorId,
    label: p.executor.email,
    offeredCents: p.offeredCents,
    offeredDays: p.offeredDays,
  }));

  const backHref =
    user.role === "ADMIN"
      ? "/admin/orders"
      : user.role === "CUSTOMER"
        ? "/customer/orders"
        : "/executor/orders";

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-6 dark:bg-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href={backHref}
            className="text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            ← Назад к списку
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{order.title}</h1>
            <OrderStatusBadge status={order.status} />
            <Badge variant="outline">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-neutral-500">
            {order.publicId} · внутр. {order.id.slice(0, 8)}…
          </p>
        </div>

        <section className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-2">
          <div>
            <p className="text-neutral-500">Бюджет</p>
            <p className="font-medium">
              {formatMoneyFromCents(order.budgetCents, order.currency)} ·{" "}
              {BUDGET_TYPE_LABELS[order.budgetType]}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Дедлайн</p>
            <p className="font-medium">{formatDateTime(order.deadlineAt)}</p>
          </div>
          <div>
            <p className="text-neutral-500">Категория</p>
            <p className="font-medium">
              {order.category.name}
              {order.subcategory ? ` / ${order.subcategory.name}` : ""}
            </p>
          </div>
          <div>
            <p className="text-neutral-500">Видимость</p>
            <p className="font-medium">{VISIBILITY_LABELS[order.visibilityType]}</p>
          </div>
          <div>
            <p className="text-neutral-500">Заказчик</p>
            <p className="font-medium">{order.customer.email}</p>
            {order.customer.customerProfile?.city ? (
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Город: {order.customer.customerProfile.city}
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">Город не указан в профиле заказчика</p>
            )}
          </div>
          <div>
            <p className="text-neutral-500">Исполнитель</p>
            <p className="font-medium">{order.executor?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-neutral-500">Создан / обновлён</p>
            <p className="font-medium">
              {formatDateTime(order.createdAt)} · {formatDateTime(order.updatedAt)}
            </p>
          </div>
          {order.urgency ? (
            <div>
              <p className="text-neutral-500">Срочность</p>
              <Badge variant="warning">Срочно</Badge>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold">Описание</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
            {order.description}
          </p>
          {order.executorRequirements ? (
            <>
              <h3 className="mt-4 text-sm font-semibold">Требования к исполнителю</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
                {order.executorRequirements}
              </p>
            </>
          ) : null}
        </section>

        <OrderPanels
          orderId={order.id}
          viewerRole={user.role as Role}
          viewerId={user.id}
          snapshot={{
            status: order.status,
            visibilityType: order.visibilityType,
            executorId: order.executorId,
            customerId: order.customerId,
            proposals,
            paymentStatus: order.paymentStatus,
            budgetCents: order.budgetCents,
            currency: order.currency,
            canOpenDispute: disputeFlags.canOpenDispute,
            hasActiveDispute: disputeFlags.hasActiveDispute,
          }}
          executorOptions={executorOptions}
          canPropose={canPropose}
        />

        <OrderChat
          orderId={order.id}
          viewerId={user.id}
          canPost={canPostToChat}
          initialMessages={chatMessages}
          unreadCount={unreadCount}
        />

        <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-sm font-semibold">История статусов</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.statusHistory.map((h) => (
              <li key={h.id} className="flex flex-wrap gap-2 border-b border-neutral-100 pb-2 last:border-0 dark:border-neutral-900">
                <span className="text-neutral-500">{formatDateTime(h.createdAt)}</span>
                <span>
                  {h.fromStatus ? ORDER_STATUS_LABELS[h.fromStatus] : "—"} →{" "}
                  {ORDER_STATUS_LABELS[h.toStatus]}
                </span>
                {h.note ? <span className="text-neutral-600">· {h.note}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
