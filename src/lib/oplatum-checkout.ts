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

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

/**
 * Достаёт sessionId + url из разных вариантов JSON (дока, вложенность, snake_case).
 */
function extractCheckoutSessionPayload(json: unknown): { id: string; url: string } | null {
  if (!isRecord(json)) return null;

  const candidates: Record<string, unknown>[] = [];
  const push = (o: unknown) => {
    if (isRecord(o)) candidates.push(o);
  };

  if (isRecord(json.data)) {
    push(json.data.data);
    push(json.data.payload);
  }
  push(json.data);
  push(json.result);
  push(json.payload);
  push(json);

  for (const block of candidates) {
    const id = pickString(block, ["sessionId", "session_id", "id"]);
    const checkoutUrl = pickString(block, [
      "url",
      "checkoutUrl",
      "checkout_url",
      "redirectUrl",
      "redirect_url",
    ]);
    if (id && checkoutUrl) {
      return { id, url: checkoutUrl };
    }
  }

  return null;
}

function formatResponseHint(json: unknown, status: number): string {
  if (json === null || json === undefined) {
    return `Пустой ответ (HTTP ${status}).`;
  }
  try {
    const s = JSON.stringify(json);
    return s.length > 280 ? `${s.slice(0, 280)}…` : s;
  } catch {
    return `Нестандартный ответ (HTTP ${status}).`;
  }
}

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

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Касса вернула не JSON (HTTP ${res.status}). Начало ответа: ${text.slice(0, 120)}`,
    );
  }

  if (isRecord(json)) {
    const errObj = json.error;
    const msgFromError =
      typeof json.message === "string"
        ? json.message
        : isRecord(errObj) && typeof errObj.message === "string"
          ? errObj.message
          : undefined;
    if (!res.ok) {
      throw new Error(msgFromError ?? `Oplatum API ${res.status}: ${formatResponseHint(json, res.status)}`);
    }
    if (json.success === false && msgFromError) {
      throw new Error(msgFromError);
    }
  } else if (!res.ok) {
    throw new Error(`Oplatum API ${res.status}`);
  }

  const extracted = extractCheckoutSessionPayload(json);
  if (extracted) {
    return extracted;
  }

  if (isRecord(json)) {
    const errObj = json.error;
    const msgFromError =
      typeof json.message === "string"
        ? json.message
        : isRecord(errObj) && typeof errObj.message === "string"
          ? errObj.message
          : undefined;
    if (msgFromError) {
      throw new Error(msgFromError);
    }
  }

  throw new Error(
    `Некорректный ответ кассы (HTTP ${res.status}). Уточните у поддержки Oplatum формат ответа. Фрагмент: ${formatResponseHint(json, res.status)}`,
  );
}
