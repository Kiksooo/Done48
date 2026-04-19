"use server";

import { NotificationKind, OrderStatus, Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { appendStatusHistory } from "@/server/orders/status";
import { getAntifraudPlatformSettings } from "@/lib/platform-antifraud";
import { createOrderSchema } from "@/schemas/order";
import { notifyActiveAdmins, notifySafe } from "@/server/notifications/service";
import { appendOrderSystemChatMessage } from "@/server/orders/order-system-chat";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function hasOrderOfflineColumns(): Promise<boolean> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'Order'",
    )) as Array<{ column_name: string }>;
    const cols = new Set(rows.map((r) => r.column_name));
    return (
      cols.has("isOfflineWork") &&
      cols.has("workAddress") &&
      cols.has("workLat") &&
      cols.has("workLng")
    );
  } catch {
    return false;
  }
}

export async function createOrderAction(raw: unknown): Promise<ActionResult<{ orderId: string }>> {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.CUSTOMER) {
    return { ok: false, error: "Нужна роль заказчика" };
  }

  const parsed = createOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  const data = parsed.data;
  const budgetCents = Math.round(data.budgetRubles * 100);
  const deadlineAt =
    data.deadlineAt && data.deadlineAt.length > 0 ? new Date(data.deadlineAt) : null;
  if (deadlineAt && Number.isNaN(deadlineAt.getTime())) {
    return { ok: false, error: "Некорректный дедлайн" };
  }

  const subId = data.subcategoryId && data.subcategoryId.length > 0 ? data.subcategoryId : null;
  if (subId) {
    const sub = await prisma.subcategory.findFirst({
      where: { id: subId, categoryId: data.categoryId },
    });
    if (!sub) {
      return { ok: false, error: "Подкатегория не относится к выбранной категории" };
    }
  }

  const af = await getAntifraudPlatformSettings();
  const status: OrderStatus = af.moderateAllNewOrders
    ? OrderStatus.ON_MODERATION
    : data.initialStatus === "ON_MODERATION"
      ? OrderStatus.ON_MODERATION
      : OrderStatus.NEW;

  const canUseOfflineColumns = await hasOrderOfflineColumns();

  try {
    const orderId = await prisma.$transaction(async (tx) => {
    const offline = Boolean(data.isOfflineWork);
    const workLat = offline && data.workLat != null ? data.workLat : null;
    const workLng = offline && data.workLng != null ? data.workLng : null;
    const workAddress =
      offline && data.workAddress && data.workAddress.length > 0 ? data.workAddress : null;

      const order = await tx.order.create({
      data: {
        customerId: user.id,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        subcategoryId: subId,
        budgetCents,
        budgetType: data.budgetType,
        deadlineAt,
        urgency: Boolean(data.urgency),
        status,
        visibilityType: data.visibilityType,
        executorRequirements: data.executorRequirements ?? undefined,
        ...(canUseOfflineColumns
          ? {
              isOfflineWork: offline,
              workAddress,
              workLat,
              workLng,
            }
          : {}),
      },
    });

      try {
        const chat = await tx.chat.create({ data: { orderId: order.id } });
        await tx.chatMember.create({ data: { chatId: chat.id, userId: user.id } });

        await appendStatusHistory(tx, {
          orderId: order.id,
          fromStatus: null,
          toStatus: status,
          actorUserId: user.id,
          note: "Создание заказа",
        });
      } catch (metaError) {
        // На старых БД служебные таблицы могут отсутствовать; не блокируем создание заказа.
        if (
          metaError instanceof Prisma.PrismaClientKnownRequestError &&
          (metaError.code === "P2021" || metaError.code === "P2022")
        ) {
          return order.id;
        }
        throw metaError;
      }

      return order.id;
    });

    revalidatePath("/customer");
    revalidatePath("/customer/orders");
    revalidatePath("/admin/orders");
    revalidatePath(`/orders/${orderId}`);

    const systemIntro =
      status === OrderStatus.ON_MODERATION
        ? "Заказ создан и отправлен на модерацию. После проверки он будет опубликован, и специалисты смогут откликаться."
        : "Заказ создан. Он станет доступен специалистам для откликов после публикации администратором.";
    await appendOrderSystemChatMessage(orderId, systemIntro);

    notifySafe(async () => {
      await notifyActiveAdmins({
        kind: NotificationKind.ORDER_CREATED,
        title: "Новый заказ",
        body: data.title,
        link: `/orders/${orderId}`,
      });
    });

    return { ok: true, data: { orderId } };
  } catch (error) {
    console.error("[create-order] failed:", error);
    return { ok: false, error: "Не удалось создать заказ. Попробуйте снова через минуту." };
  }
}
