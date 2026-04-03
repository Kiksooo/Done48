import { revalidatePath } from "next/cache";
import {
  getOplatumWebhookSecret,
  getOplatumWebhookSignatureHeaderName,
  getOplatumWebhookTimestampHeaderName,
} from "@/lib/oplatum-config";
import { verifyOplatumMerchantWebhookSignature } from "@/lib/oplatum-webhook-verify";
import { fulfillCustomerTopUpFromCheckoutSession } from "@/server/payments/oplatum-fulfill-topup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function webhookToleranceSec(): number {
  const n = Number(process.env.OPLATUM_WEBHOOK_TOLERANCE_SEC ?? "300");
  return Number.isFinite(n) && n > 0 ? n : 300;
}

type OplatumEvent = {
  type?: string;
  data?: { object?: Record<string, unknown> };
};

function parseAmountToKopecks(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.round(v * 100);
  }
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100);
  }
  return null;
}

function extractCheckoutSessionCompleted(event: OplatumEvent): {
  sessionId: string;
  paid: boolean;
  amountKopecks: number | null;
} | null {
  if (event.type !== "checkout.session.completed") {
    return null;
  }
  const d = event.data as Record<string, unknown> | undefined;
  const o = (d?.object ?? d) as Record<string, unknown>;
  const sessionId =
    typeof o.sessionId === "string" ? o.sessionId : typeof o.id === "string" ? o.id : "";
  if (!sessionId) {
    return null;
  }
  const status = typeof o.status === "string" ? o.status.toLowerCase() : "";
  const paid = status === "complete" || status === "completed" || status === "paid";
  return {
    sessionId,
    paid,
    amountKopecks: parseAmountToKopecks(o.amount),
  };
}

export async function POST(req: Request) {
  const secret = getOplatumWebhookSecret();
  if (!secret) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const raw = await req.text();
  const sigName = getOplatumWebhookSignatureHeaderName();
  const tsName = getOplatumWebhookTimestampHeaderName();
  const signature =
    req.headers.get(sigName) ?? req.headers.get(sigName.toLowerCase());
  const timestamp =
    req.headers.get(tsName) ?? req.headers.get(tsName.toLowerCase());

  if (
    !verifyOplatumMerchantWebhookSignature({
      rawBody: raw,
      signatureHeader: signature,
      timestampHeader: timestamp,
      secret,
      toleranceSec: webhookToleranceSec(),
    })
  ) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: OplatumEvent;
  try {
    event = JSON.parse(raw) as OplatumEvent;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const checkout = extractCheckoutSessionCompleted(event);
  if (checkout) {
    const r = await fulfillCustomerTopUpFromCheckoutSession({
      sessionId: checkout.sessionId,
      amountKopecks: checkout.amountKopecks,
      paid: checkout.paid,
    });

    if (r.ok) {
      revalidatePath("/customer/balance");
      revalidatePath("/admin/payments");
    }

    if (!r.ok) {
      if (r.reason === "unknown_intent" || r.reason === "not_paid" || r.reason === "no_amount") {
        return new Response("ok");
      }
      if (r.reason === "bad_state") {
        return new Response("ok");
      }
      if (r.reason === "amount_mismatch") {
        console.error("[oplatum webhook] amount mismatch", checkout);
        return new Response("ok");
      }
      return new Response("error", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}
