import { OrderStatus, ProposalStatus, type Role } from "@prisma/client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderChat } from "@/components/orders/order-chat";
import { OrderPanels } from "@/components/orders/order-panels";
import { OrderReportSection } from "@/components/orders/order-report-section";
import { OrderReviewsSection, type OrderReviewRow } from "@/components/reviews/order-reviews-section";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { countUnreadChatMessages } from "@/lib/chat-unread";
import { formatDateTime } from "@/lib/format";
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
import { canRevealOrderPartyEmail } from "@/lib/order-contact-privacy";
import { reviewerAvatarUrl, reviewerDisplayName } from "@/lib/review-display";
import { findReviewByOrderAndAuthor, listReviewsForOrder } from "@/server/queries/reviews";
import { OrderBudgetDetailBlock } from "@/components/orders/order-budget-display";
import { getPlatformFeePercent } from "@/server/finance/split";

const OrderLocationMap = dynamic(
  () =>
    import("@/components/maps/order-location-map").then((m) => ({
      default: m.OrderLocationMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-60 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
    ),
  },
);

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

  const customerPartnerUserIds = order.customerPartners.map((p) => p.userId);
  const customerPartnersListed = order.customerPartners.map((p) => {
    const dn = p.user.customerProfile?.displayName?.trim();
    return {
      userId: p.user.id,
      label: dn || p.user.email.split("@")[0] || p.user.email,
    };
  });

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

  const isPrimaryCustomer = user.id === order.customerId;
  const isPartnerCustomer =
    user.role === "CUSTOMER" && customerPartnerUserIds.includes(user.id);
  const canPostToChat =
    user.role === "ADMIN" ||
    isPrimaryCustomer ||
    isPartnerCustomer ||
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
  const platformFeePercent = await getPlatformFeePercent();

  const reviewable =
    order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.COMPLETED;

  let reviewTarget: { toUserId: string; label: string } | null = null;
  if (reviewable && order.executorId) {
    if (user.role === "CUSTOMER" && user.id === order.customerId) {
      reviewTarget = { toUserId: order.executorId, label: "исполнителю" };
    } else if (user.role === "EXECUTOR" && user.id === order.executorId) {
      reviewTarget = { toUserId: order.customerId, label: "заказчику" };
    }
  }

  const [orderReviewsList, myReviewRow] = await Promise.all([
    listReviewsForOrder(order.id),
    user.role === "CUSTOMER" || user.role === "EXECUTOR"
      ? findReviewByOrderAndAuthor(order.id, user.id)
      : Promise.resolve(null),
  ]);

  const orderReviewRows: OrderReviewRow[] = orderReviewsList.map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt.toISOString(),
    reviewerName: reviewerDisplayName(r.fromUser, "full"),
    reviewerAvatarUrl: reviewerAvatarUrl(r.fromUser),
  }));

  let reportTargetId: string | null = null;
  if (user.role !== "ADMIN") {
    const onCustomerSide =
      user.role === "CUSTOMER" &&
      (user.id === order.customerId || customerPartnerUserIds.includes(user.id));
    if (onCustomerSide && order.executorId) {
      reportTargetId = order.executorId;
    } else if (user.role === "EXECUTOR") {
      const assigned = order.executorId === user.id;
      const pendingProp =
        !assigned &&
        (await prisma.proposal.findFirst({
          where: {
            orderId: order.id,
            executorId: user.id,
            status: ProposalStatus.PENDING,
          },
        }));
      if (assigned || pendingProp) {
        reportTargetId = order.customerId;
      }
    }
  }

  const reportCounterpartyLabel =
    reportTargetId === order.customerId
      ? "Заказчик"
      : reportTargetId === order.executorId
        ? "Исполнитель"
        : "Участник";

  const showCustomerEmail = canRevealOrderPartyEmail({
    viewerRole: user.role as Role,
    viewerId: user.id,
    partyUserId: order.customer.id,
    customerId: order.customerId,
    executorId: order.executorId,
    customerPartnerUserIds,
  });

  const customerPublicName =
    order.customer.customerProfile?.displayName?.trim() ||
    (showCustomerEmail ? order.customer.email : "Заказчик");

  const showExecutorEmail =
    order.executor !== null &&
    canRevealOrderPartyEmail({
      viewerRole: user.role as Role,
      viewerId: user.id,
      partyUserId: order.executor.id,
      customerId: order.customerId,
      executorId: order.executorId,
      customerPartnerUserIds,
    });

  let executorPublicName: string | null = null;
  if (order.executor) {
    const dn = order.executor.executorProfile?.displayName?.trim();
    const un = order.executor.executorProfile?.username?.trim();
    if (dn) executorPublicName = dn;
    else if (un) executorPublicName = `@${un}`;
    else if (showExecutorEmail) executorPublicName = order.executor.email;
    else executorPublicName = "Исполнитель";
  }

  const proposals = order.proposals.map((p) => {
    const ep = p.executor.executorProfile;
    const dn = ep?.displayName?.trim();
    const un = ep?.username?.trim();
    const label = dn || (un ? `@${un}` : null) || p.executor.email;
    return {
      id: p.id,
      status: p.status,
      executorId: p.executorId,
      label,
      offeredCents: p.offeredCents,
      offeredDays: p.offeredDays,
    };
  });

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
          <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Номер заказа:</span>{" "}
            <span className="font-mono text-neutral-800 dark:text-neutral-200">{order.publicId}</span>
            {user.role === "ADMIN" ? (
              <span
                className="ml-2 font-mono text-neutral-400 dark:text-neutral-500"
                title="Технический id в базе (для логов и поддержки)"
              >
                · служебный: {order.id}
              </span>
            ) : null}
          </p>
        </div>

        <section className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-2">
          <OrderBudgetDetailBlock
            budgetCents={order.budgetCents}
            currency={order.currency}
            feePercent={platformFeePercent}
            budgetTypeLine={BUDGET_TYPE_LABELS[order.budgetType]}
          />
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
            <p className="font-medium">{showCustomerEmail ? order.customer.email : customerPublicName}</p>
            {!showCustomerEmail ? (
              <p className="mt-1 text-xs text-neutral-500">
                Почта скрыта до назначения исполнителя. Общение — в чате по заказу после того, как вас назначат.
              </p>
            ) : null}
            {order.customer.customerProfile?.city ? (
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Город: {order.customer.customerProfile.city}
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-500">Город не указан в профиле заказчика</p>
            )}
            {order.customerPartners.length > 0 ? (
              <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Соучастники</p>
                <ul className="mt-1 space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
                  {order.customerPartners.map((p) => {
                    const showP = canRevealOrderPartyEmail({
                      viewerRole: user.role as Role,
                      viewerId: user.id,
                      partyUserId: p.user.id,
                      customerId: order.customerId,
                      executorId: order.executorId,
                      customerPartnerUserIds,
                    });
                    const label =
                      p.user.customerProfile?.displayName?.trim() ||
                      (showP ? p.user.email : "Заказчик (соучастник)");
                    return <li key={p.id}>{label}</li>;
                  })}
                </ul>
              </div>
            ) : null}
          </div>
          <div>
            <p className="text-neutral-500">Исполнитель</p>
            <p className="font-medium">
              {order.executor ? (showExecutorEmail ? order.executor.email : executorPublicName) : "—"}
            </p>
            {order.executor && !showExecutorEmail ? (
              <p className="mt-1 text-xs text-neutral-500">Контакт исполнителя доступен сторонам сделки.</p>
            ) : null}
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

        {order.isOfflineWork ? (
          <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-sm font-semibold">Место выполнения (офлайн)</h2>
            {order.workAddress ? (
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{order.workAddress}</p>
            ) : null}
            {order.workLat != null && order.workLng != null ? (
              <div className={order.workAddress ? "mt-4" : "mt-2"}>
                <OrderLocationMap lat={order.workLat} lng={order.workLng} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                Точка на карте не указана — уточните адрес в чате с заказчиком.
              </p>
            )}
          </section>
        ) : null}

        <OrderReviewsSection
          orderId={order.id}
          reviewTarget={reviewTarget}
          alreadyReviewed={Boolean(myReviewRow)}
          reviews={orderReviewRows}
        />

        {reportTargetId ? (
          <OrderReportSection orderId={order.id} counterpartyLabel={reportCounterpartyLabel} />
        ) : null}

        <OrderPanels
          orderId={order.id}
          viewerRole={user.role as Role}
          viewerId={user.id}
          snapshot={{
            status: order.status,
            visibilityType: order.visibilityType,
            executorId: order.executorId,
            customerId: order.customerId,
            customerPartnerUserIds,
            customerPartnersListed,
            proposals,
            paymentStatus: order.paymentStatus,
            budgetCents: order.budgetCents,
            currency: order.currency,
            platformFeePercent,
            canOpenDispute: disputeFlags.canOpenDispute,
            hasActiveDispute: disputeFlags.hasActiveDispute,
          }}
          executorOptions={executorOptions}
          canPropose={canPropose}
        />

        <OrderChat
          orderId={order.id}
          viewerId={user.id}
          viewerRole={user.role as Role}
          customerId={order.customerId}
          executorId={order.executorId}
          customerPartnerUserIds={customerPartnerUserIds}
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
