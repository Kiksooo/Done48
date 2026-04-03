import { getOplatumApiBaseUrl, getOplatumPaymentMethodTypes, getOplatumSecretKey } from "@/lib/oplatum-config";

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
  const methods = getOplatumPaymentMethodTypes();
  methods.forEach((type, i) => {
    body.set(`payment_method_types[${i}]`, type);
  });
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", "rub");
  body.set("line_items[0][price_data][unit_amount]", String(params.amountCents));
  body.set("line_items[0][price_data][product_data][name]", "Пополнение баланса DONE48");

  for (const [k, v] of Object.entries(params.metadata)) {
    body.set(`metadata[${k}]`, v);
  }

  let res: Response;
  try {
    res = await fetch(`${base}/v1/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  } catch (e) {
    const cause =
      e instanceof Error && "cause" in e
        ? (e as Error & { cause?: unknown }).cause
        : undefined;
    const detail =
      cause instanceof Error ? cause.message : cause != null ? String(cause) : e instanceof Error ? e.message : "";
    throw new Error(
      detail
        ? `Нет связи с кассой (${detail}). Проверьте OPLATUM_API_BASE_URL в доке Oplatum и исходящий интернет с сервера.`
        : "Нет связи с кассой. Проверьте OPLATUM_API_BASE_URL и сеть сервера.",
    );
  }

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
