import {
  getOplatumApiBaseUrl,
  getOplatumApiKey,
  getOplatumHmacSecret,
} from "@/lib/oplatum-config";
import { buildOplatumMerchantSignedHeaders } from "@/lib/oplatum-request-auth";

export type OplatumCheckoutSessionResult = {
  id: string;
  url: string;
};

/** URL создания сессии: {OPLATUM_API_BASE_URL}/{OPLATUM_MERCHANT_API_PREFIX}/checkout/sessions */
function merchantCheckoutSessionsUrl(): URL {
  const baseRaw = getOplatumApiBaseUrl();
  if (!baseRaw) {
    throw new Error("Задайте OPLATUM_API_BASE_URL (только origin, без пути к эндпоинту).");
  }
  const base = baseRaw.replace(/\/$/, "");
  const prefix =
    process.env.OPLATUM_MERCHANT_API_PREFIX?.trim().replace(/^\/|\/$/g, "") || "merchant-api/v1";
  return new URL(`${prefix}/checkout/sessions`, `${base}/`);
}

type ApiEnvelope = {
  success?: boolean;
  data?: { sessionId?: string; url?: string };
  error?: { message?: string };
};

/**
 * POST /merchant-api/v1/checkout/sessions — см. https://oplatum.com/api-docs
 */
export async function oplatumCreateCheckoutSession(params: {
  idempotencyKey: string;
  amountRubles: number;
  description: string;
  successUrl: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}): Promise<OplatumCheckoutSessionResult> {
  const apiKey = getOplatumApiKey();
  const apiSecret = getOplatumHmacSecret();
  if (!apiKey) {
    throw new Error("Задайте OPLATUM_API_KEY (ak_live_…).");
  }
  if (!apiSecret) {
    throw new Error("Задайте OPLATUM_SECRET_KEY (sk_live_…) для подписи запросов.");
  }

  const url = merchantCheckoutSessionsUrl();
  const pathWithQuery = `${url.pathname}${url.search}`;

  const bodyObj: Record<string, unknown> = {
    amount: params.amountRubles,
    description: params.description,
    successUrl: params.successUrl,
  };
  if (params.cancelUrl) {
    bodyObj.cancelUrl = params.cancelUrl;
  }
  if (params.metadata && Object.keys(params.metadata).length > 0) {
    bodyObj.metadata = params.metadata;
  }
  const bodyStr = JSON.stringify(bodyObj);

  const auth = buildOplatumMerchantSignedHeaders({
    method: "POST",
    pathWithQuery,
    body: bodyStr,
    apiKey,
    apiSecret,
  });

  let res: Response;
  try {
    res = await fetch(url.href, {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey.slice(0, 255),
      },
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
        ? `Нет связи с кассой (${detail}). Проверьте OPLATUM_API_BASE_URL.`
        : "Нет связи с кассой.",
    );
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope | null;
  if (!res.ok) {
    const msg = json?.error?.message ?? `Oplatum API ${res.status}`;
    throw new Error(msg);
  }
  if (!json?.success || !json.data) {
    const msg = json?.error?.message ?? "Некорректный ответ кассы";
    throw new Error(msg);
  }
  const { sessionId, url: checkoutUrl } = json.data;
  if (!checkoutUrl || !sessionId) {
    throw new Error("В ответе нет sessionId или url");
  }

  return { id: sessionId, url: checkoutUrl };
}
