import crypto from "node:crypto";

/**
 * Аутентификация Merchant API Oplatum (раздел «Аутентификация» на /api-docs):
 * string_to_sign = "{timestamp}.{nonce}.{METHOD}.{path}.{body}"
 * POST: body — JSON-строка; GET: body — ""
 * signature = HMAC-SHA256(secret_key, string_to_sign) → hex lowercase
 * Заголовки: X-Api-Key, X-Timestamp, X-Nonce, X-Signature, Idempotency-Key (для POST)
 */

export type OplatumMerchantAuthHeaders = {
  "X-Api-Key": string;
  "X-Timestamp": string;
  "X-Nonce": string;
  "X-Signature": string;
};

export function buildOplatumMerchantSignedHeaders(params: {
  method: string;
  /** Полный путь с ведущим /, напр. /merchant-api/v1/checkout/sessions */
  pathWithQuery: string;
  /** Тело как уходит в запросе (JSON-строка или "") */
  body: string;
  apiKey: string;
  apiSecret: string;
}): OplatumMerchantAuthHeaders {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const stringToSign = [ts, nonce, params.method.toUpperCase(), params.pathWithQuery, params.body].join(".");
  const signature = crypto.createHmac("sha256", params.apiSecret).update(stringToSign, "utf8").digest("hex");

  return {
    "X-Api-Key": params.apiKey,
    "X-Timestamp": ts,
    "X-Nonce": nonce,
    "X-Signature": signature,
  };
}
