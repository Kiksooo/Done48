import { CustomerTopUpIntentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { oplatumRetrieveCheckoutSession } from "@/lib/oplatum-checkout";
import { isOplatumBalanceTopUpConfigured } from "@/lib/oplatum-config";
import { prisma } from "@/lib/db";
import { fulfillCustomerTopUpFromCheckoutSession } from "./oplatum-fulfill-topup";

const PENDING_MAX_AGE_MS = 48 * 60 * 60 * 1000;

/**
 * После successUrl (?topup=success): запрашиваем сессию в Oplatum и зачисляем баланс,
 * если оплата прошла — на случай, когда POST-вебхук не доходит до Vercel.
 */
export async function tryFulfillPendingOplatumTopUp(userId: string): Promise<boolean> {
  if (!isOplatumBalanceTopUpConfigured()) {
    return false;
  }

  const since = new Date(Date.now() - PENDING_MAX_AGE_MS);

  const intent = await prisma.customerTopUpIntent.findFirst({
    where: {
      userId,
      status: CustomerTopUpIntentStatus.PENDING,
      providerSessionId: { not: null },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  const sessionId = intent?.providerSessionId;
  if (!intent || !sessionId) {
    return false;
  }

  let remote;
  try {
    remote = await oplatumRetrieveCheckoutSession(sessionId);
  } catch (e) {
    console.error("[oplatum sync] retrieve failed", e);
    return false;
  }

  if (!remote?.paid) {
    return false;
  }

  const r = await fulfillCustomerTopUpFromCheckoutSession({
    sessionId,
    amountKopecks: remote.amountKopecks,
    paid: remote.paid,
  });

  if (r.ok) {
    revalidatePath("/customer/balance");
    revalidatePath("/admin/payments");
    return true;
  }

  console.warn("[oplatum sync] fulfill after retrieve", r.reason, sessionId);
  return false;
}
