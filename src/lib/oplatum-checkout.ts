import {
  getOplatumApiBaseUrl,
  getOplatumApiKey,
  getOplatumHmacSecret,
  getOplatumPaymentMethodTypes,
  getOplatumSecretKey,
} from "@/lib/oplatum-config";
import { buildOplatumSignedHeaders } from "@/lib/oplatum-request-auth";

export type OplatumCheckoutSessionResult = {
  id: string;
  url: string;
};

/**
 * Создаёт Checkout Session (POST /v1/checkout/sessions) с подписью X-Api-Key / X-Signature.
 */
export async function oplatumCreateCheckoutSession(params: {
  amountCents: number;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<OplatumCheckoutSessionResult> {
  const apiKey = getOplatumApiKey();
  const apiSecret = getOplatumHmacSecret();
  if (!apiKey) {
    throw new Error("Задайте OPLATUM_API_KEY (ak_live_…) для заголовка X-Api-Key.");
  }
  if (!apiSecret) {
    throw new Error(
      "Задайте OPLATUM_SECRET_KEY (sk_live_…) для подписи запросов. Либо OPLATUM_HMAC_SECRET, либо OPLATUM_SIGN_WITH_API_KEY=true (только если так сказано в доке Oplatum).",
    );
  }

  const base = getOplatumApiBaseUrl();
  if (!base) {
    throw new Error(
      "Задайте OPLATUM_API_BASE_URL — базовый URL API из личного кабинета Oplatum (https://… без /v1).",
    );
  }

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

  const bodyStr = body.toString();
  const fetchUrl = new URL("v1/checkout/sessions", `${base.replace(/\/$/, "")}/`);
  const pathWithQuery = `${fetchUrl.pathname}${fetchUrl.search}`;

  const signHeaders = buildOplatumSignedHeaders({
    method: "POST",
    pathWithQuery,
    body: bodyStr,
    apiKey,
    apiSecret,
  });

  const headers: Record<string, string> = {
    ...signHeaders,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (process.env.OPLATUM_ALSO_SEND_BEARER === "true") {
    const sk = getOplatumSecretKey();
    if (sk) headers.Authorization = `Bearer ${sk}`;
  }

  let res: Response;
  try {
    res = await fetch(fetchUrl, {
      method: "POST",
      headers,
      body: bodyStr,
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
        ? `Нет связи с кассой (${detail}). Проверьте OPLATUM_API_BASE_URL и исходящий интернет с сервера.`
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
