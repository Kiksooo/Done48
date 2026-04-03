import crypto from "node:crypto";

/**
 * Проверка Stripe-совместимой подписи вебхука (t=…, v1=…, HMAC-SHA256).
 */
export function verifyOplatumStripeStyleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSec: number,
): boolean {
  if (!signatureHeader || !secret) return false;

  let t = "";
  const v1s: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key === "t") t = val;
    else if (key === "v1" && val) v1s.push(val);
  }

  if (!t || v1s.length === 0) return false;

  const ts = Number(t);
  if (!Number.isFinite(ts)) return false;
  const skew = Math.abs(Date.now() / 1000 - ts);
  if (skew > toleranceSec) return false;

  const signedPayload = `${t}.${rawBody}`;
  const expectedHex = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return v1s.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedHex, "hex"));
    } catch {
      return false;
    }
  });
}

export type StripeStyleWebhookEvent = {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
};
