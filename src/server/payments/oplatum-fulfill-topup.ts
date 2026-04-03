import { CustomerTopUpIntentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function fulfillCustomerTopUpFromCheckoutSession(params: {
  sessionId: string;
  amountTotal: number | null;
  paymentStatus: string | undefined;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { sessionId, amountTotal, paymentStatus } = params;

  if (paymentStatus !== "paid") {
    return { ok: false, reason: "not_paid" };
  }
  if (amountTotal == null || amountTotal <= 0) {
    return { ok: false, reason: "no_amount" };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const intent = await tx.customerTopUpIntent.findUnique({
          where: { providerSessionId: sessionId },
        });
        if (!intent) {
          throw new Error("UNKNOWN_INTENT");
        }
        if (intent.status === CustomerTopUpIntentStatus.COMPLETED) {
          return;
        }
        if (intent.status !== CustomerTopUpIntentStatus.PENDING) {
          throw new Error("BAD_STATE");
        }
        if (intent.amountCents !== amountTotal) {
          throw new Error("AMOUNT_MISMATCH");
        }

        await tx.customerProfile.update({
          where: { userId: intent.userId },
          data: { balanceCents: { increment: intent.amountCents } },
        });
        await tx.transaction.create({
          data: {
            type: "TOPUP",
            amountCents: intent.amountCents,
            currency: intent.currency,
            toUserId: intent.userId,
            meta: { source: "oplatum", providerSessionId: sessionId },
          },
        });
        await tx.customerTopUpIntent.update({
          where: { id: intent.id },
          data: { status: CustomerTopUpIntentStatus.COMPLETED, completedAt: new Date() },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "UNKNOWN_INTENT") return { ok: false, reason: "unknown_intent" };
    if (msg === "BAD_STATE") return { ok: false, reason: "bad_state" };
    if (msg === "AMOUNT_MISMATCH") return { ok: false, reason: "amount_mismatch" };
    throw e;
  }

  return { ok: true };
}
