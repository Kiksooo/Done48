import { revalidatePath } from "next/cache";
import {
  getOplatumWebhookSecret,
  getOplatumWebhookSignatureHeaderName,
  getOplatumWebhookTimestampHeaderName,
} from "@/lib/oplatum-config";
import { fulfillmentFromWebhookEvent, isOplatumRecord } from "@/lib/oplatum-checkout-session-state";
import { verifyOplatumMerchantWebhookSignature } from "@/lib/oplatum-webhook-verify";
import { fulfillCustomerTopUpFromCheckoutSession } from "@/server/payments/oplatum-fulfill-topup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Проверка в браузере / из ЛК (часто делают GET перед сохранением вебхука).
 * Реальные уведомления об оплате Oplatum шлёт методом POST.
 */
export async function GET() {
  const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>Oplatum webhook</title></head><body style="font:16px system-ui;padding:1.5rem;line-height:1.5;color:#111"><h1 style="font-size:1.1rem">Эндпоинт вебхука</h1><p>Страница открыта по <code>GET</code> — так и должно быть для проверки. Зачисление баланса делает только <strong>POST</strong> от Oplatum после оплаты.</p><p><code>GET /api/webhooks/oplatum — OK</code></p></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function webhookToleranceSec(): number {
  const n = Number(process.env.OPLATUM_WEBHOOK_TOLERANCE_SEC ?? "300");
  return Number.isFinite(n) && n > 0 ? n : 300;
}

type OplatumEvent = {
  type?: string;
  data?: { object?: Record<string, unknown> };
};

export async function POST(req: Request) {
  const secret = getOplatumWebhookSecret();
  if (!secret) {
    console.error("[oplatum webhook] OPLATUM_WEBHOOK_SECRET not set");
    return new Response("Webhook not configured", { status: 503 });
  }

  const raw = await req.text();
  console.log("[oplatum webhook] received, body length:", raw.length, "body:", raw.slice(0, 500));

  const sigName = getOplatumWebhookSignatureHeaderName();
  const tsName = getOplatumWebhookTimestampHeaderName();
  const signature =
    req.headers.get(sigName) ?? req.headers.get(sigName.toLowerCase());
  const timestamp =
    req.headers.get(tsName) ?? req.headers.get(tsName.toLowerCase());

  console.log("[oplatum webhook] sig header:", sigName, "=", signature ? `${signature.slice(0, 16)}…` : "MISSING");
  console.log("[oplatum webhook] ts header:", tsName, "=", timestamp ?? "MISSING");

  if (
    !verifyOplatumMerchantWebhookSignature({
      rawBody: raw,
      signatureHeader: signature,
      timestampHeader: timestamp,
      secret,
      toleranceSec: webhookToleranceSec(),
    })
  ) {
    console.error("[oplatum webhook] signature verification FAILED");
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("[oplatum webhook] signature OK");

  let event: OplatumEvent;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isOplatumRecord(parsed) && isOplatumRecord(parsed.event)) {
      event = parsed.event as OplatumEvent;
    } else {
      event = parsed as OplatumEvent;
    }
  } catch {
    console.error("[oplatum webhook] invalid JSON");
    return new Response("Bad JSON", { status: 400 });
  }

  console.log("[oplatum webhook] event type:", event.type);

  const checkout = fulfillmentFromWebhookEvent(event);
  if (!checkout) {
    console.log(
      "[oplatum webhook] no paid checkout session in payload (type or shape); ignoring. type=",
      event.type,
    );
    return new Response("ok", { status: 200 });
  }

  console.log("[oplatum webhook] checkout extracted:", JSON.stringify(checkout));

  const r = await fulfillCustomerTopUpFromCheckoutSession({
    sessionId: checkout.sessionId,
    amountKopecks: checkout.amountKopecks,
    paid: checkout.paid,
  });

  if (r.ok) {
    console.log("[oplatum webhook] balance credited successfully for session:", checkout.sessionId);
    revalidatePath("/customer/balance");
    revalidatePath("/admin/payments");
    return new Response("ok", { status: 200 });
  }

  console.error("[oplatum webhook] fulfill failed:", r.reason, "checkout:", JSON.stringify(checkout));
  return new Response("ok");
}
