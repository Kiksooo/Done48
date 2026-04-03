import { revalidatePath } from "next/cache";
import {
  getOplatumWebhookSecret,
  getOplatumWebhookSignatureHeaderName,
} from "@/lib/oplatum-config";
import { verifyOplatumStripeStyleSignature, type StripeStyleWebhookEvent } from "@/lib/oplatum-webhook";
import { fulfillCustomerTopUpFromCheckoutSession } from "@/server/payments/oplatum-fulfill-topup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function webhookToleranceSec(): number {
  const n = Number(process.env.OPLATUM_WEBHOOK_TOLERANCE_SEC ?? "300");
  return Number.isFinite(n) && n > 0 ? n : 300;
}

export async function POST(req: Request) {
  const secret = getOplatumWebhookSecret();
  if (!secret) {
    return new Response("Webhook not configured", { status: 503 });
  }

  const raw = await req.text();
  const headerName = getOplatumWebhookSignatureHeaderName();
  const sig = req.headers.get(headerName) ?? req.headers.get(headerName.toLowerCase());

  if (!verifyOplatumStripeStyleSignature(raw, sig, secret, webhookToleranceSec())) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: StripeStyleWebhookEvent;
  try {
    event = JSON.parse(raw) as StripeStyleWebhookEvent;
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const obj = event.data?.object ?? {};
    const sessionId = typeof obj.id === "string" ? obj.id : "";
    const paymentStatus = typeof obj.payment_status === "string" ? obj.payment_status : undefined;
    const amountTotal = typeof obj.amount_total === "number" ? obj.amount_total : null;

    if (!sessionId) {
      return new Response("ok");
    }

    const r = await fulfillCustomerTopUpFromCheckoutSession({
      sessionId,
      amountTotal,
      paymentStatus,
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
        console.error("[oplatum webhook] amount mismatch", { sessionId, amountTotal });
        return new Response("ok");
      }
      return new Response("error", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}
