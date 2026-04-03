import crypto from "node:crypto";

/**
 * Вебхук Oplatum: HMAC-SHA256(secret, "{timestamp}.{rawBody}") → hex,
 * заголовки X-Webhook-Signature и X-Webhook-Timestamp (дока /api-docs).
 */
export function verifyOplatumMerchantWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  toleranceSec: number;
}): boolean {
  const { rawBody, signatureHeader, timestampHeader, secret, toleranceSec } = params;
  if (!signatureHeader || !timestampHeader || !secret) return false;

  const ts = Number(timestampHeader);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;

  const payload = `${timestampHeader}.${rawBody}`;
  const expectedHex = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader, "hex"), Buffer.from(expectedHex, "hex"));
  } catch {
    return false;
  }
}
