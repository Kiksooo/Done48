import { ExecutorAccountStatus, Role } from "@prisma/client";
import { formatMoneyFromCents } from "@/lib/format";
import { sendTransactionalEmail } from "@/lib/email-outbound";
import { prisma } from "@/lib/db";
import { toAbsoluteSiteUrl } from "@/lib/site-url";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * После публикации заказа админом — письмо всем активным специалистам с открытой лентой заказов.
 */
export async function sendPublishedOrderEmailsToExecutors(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, title: true, status: true, customerId: true },
  });
  if (!order || order.status !== "PUBLISHED") return;

  const link = toAbsoluteSiteUrl(`/orders/${order.id}`);
  const titleShort = truncate(order.title, 72);
  const subject = `DONE48 — новый заказ: ${titleShort}`;

  const executors = await prisma.user.findMany({
    where: {
      role: Role.EXECUTOR,
      isActive: true,
      id: { not: order.customerId },
      executorProfile: { is: { accountStatus: ExecutorAccountStatus.ACTIVE } },
    },
    select: { email: true },
  });

  const titleEsc = escapeHtml(order.title);
  const text = [
    "На площадке DONE48 опубликован новый заказ.",
    "",
    `«${order.title}»`,
    "",
    `Открыть карточку заказа: ${link}`,
    "",
    "Если вы не хотите получать такие уведомления, напишите на контактную почту сайта.",
  ].join("\n");

  const html = `<p>На площадке DONE48 опубликован новый заказ.</p><p><strong>${titleEsc}</strong></p><p><a href="${escapeHtml(link)}">Открыть карточку заказа</a></p><p style="font-size:12px;color:#666;">Если ссылка не открывается, скопируйте её в браузер:<br/><span style="word-break:break-all">${escapeHtml(link)}</span></p>`;

  for (const row of executors) {
    const to = row.email.trim();
    if (!to) continue;
    const r = await sendTransactionalEmail({ to, subject, text, html });
    if (!r.sent) {
      console.error("[order-email] executor digest failed", to, r);
    }
  }
}

export type NewProposalEmailParams = {
  customerId: string;
  orderId: string;
  orderTitle: string;
  executorLabel: string;
  offeredCents?: number;
  offeredDays?: number | null;
  message?: string | null;
};

/**
 * После отклика специалиста — письмо заказчику.
 */
export async function sendNewProposalEmailToCustomer(params: NewProposalEmailParams): Promise<void> {
  const customer = await prisma.user.findUnique({
    where: { id: params.customerId },
    select: { email: true, isActive: true },
  });
  if (!customer?.isActive) return;
  const to = customer.email.trim();
  if (!to) return;

  const link = toAbsoluteSiteUrl(`/orders/${params.orderId}`);
  const titleShort = truncate(params.orderTitle, 60);
  const subject = `DONE48 — отклик на заказ «${titleShort}»`;

  const lines: string[] = [
    `Специалист «${params.executorLabel}» откликнулся на ваш заказ «${params.orderTitle}».`,
    "",
    `Карточка заказа: ${link}`,
  ];
  const comment = params.message?.replace(/\s+/g, " ").trim();
  if (comment) {
    lines.push("", `Комментарий специалиста: ${truncate(comment, 800)}`);
  }
  const terms: string[] = [];
  if (params.offeredCents !== undefined) {
    terms.push(`Предложенная стоимость: ${formatMoneyFromCents(params.offeredCents)}`);
  }
  if (params.offeredDays != null) {
    terms.push(`Срок: ${params.offeredDays} дн.`);
  }
  if (terms.length) {
    lines.push("", terms.join(". ") + ".");
  }

  const text = lines.join("\n");

  const escLabel = escapeHtml(params.executorLabel);
  const escTitle = escapeHtml(params.orderTitle);
  let html = `<p>Специалист <strong>${escLabel}</strong> откликнулся на ваш заказ <strong>${escTitle}</strong>.</p><p><a href="${escapeHtml(link)}">Открыть карточку заказа</a></p>`;
  if (comment) {
    html += `<p>Комментарий специалиста:<br/>${escapeHtml(truncate(comment, 800))}</p>`;
  }
  if (terms.length) {
    html += `<p>${escapeHtml(terms.join(". ") + ".")}</p>`;
  }
  html += `<p style="font-size:12px;color:#666;">Ссылка: <span style="word-break:break-all">${escapeHtml(link)}</span></p>`;

  const r = await sendTransactionalEmail({ to, subject, text, html });
  if (!r.sent) {
    console.error("[order-email] proposal to customer failed", to, r);
  }
}
