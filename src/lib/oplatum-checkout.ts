import { getOplatumApiBaseUrl, getOplatumSecretKey } from "@/lib/oplatum-config";

export type OplatumCheckoutSessionResult = {
  id: string;
  url: string;
};

/**
 * Создаёт Checkout Session (Stripe-совместимый POST /v1/checkout/sessions).
 */
export async function oplatumCreateCheckoutSession(params: {
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<OplatumCheckoutSessionResult> {
  const secret = getOplatumSecretKey();
  if (!secret) {
    throw new Error("OPLATUM_SECRET_KEY не задан");
  }

  const base = getOplatumApiBaseUrl();
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", params.successUrl);
  body.set("cancel_url", params.cancelUrl);
  body.set("payment_method_types[0]", "card");
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "rub");
  body.set("line_items[0][price_data][unit_amount]", String(params.amountCents));
  body.set("line_items[0][price_data][product_data][name]", "Пополнение баланса DONE48");

  for (const [k, v] of Object.entries(params.metadata)) {
    body.set(`metadata[${k}]`, v);
  }

  const res = await fetch(`${base}/v1/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await res.json().catch(() => null)) as
    | { url?: string; id?: string; error?: { message?: string } }
    | null;

  if (!res.ok) {
    const msg = json?.error?.message ?? `Oplatum API ${res.status}`;
    throw new Error(msg);
  }

  if (!json?.url || !json?.id) {
    throw new Error("Некорректный ответ кассы: нет url или id сессии");
  }

  return { id: json.id, url: json.url };
}
