/**
 * Oplatum: ключи в кабинете (ak_live / sk_live / whsec_).
 * HTTP по умолчанию совместим со Stripe API (Checkout Session + подпись вебхука).
 * Если у провайдера другой хост — задайте OPLATUM_API_BASE_URL.
 */

const DEFAULT_API_BASE = "https://api.oplatum.com";

export function getOplatumApiBaseUrl(): string {
  const raw = process.env.OPLATUM_API_BASE_URL?.trim();
  return (raw || DEFAULT_API_BASE).replace(/\/$/, "");
}

/** Серверный секрет для REST (обычно sk_live_…). */
export function getOplatumSecretKey(): string | undefined {
  return process.env.OPLATUM_SECRET_KEY?.trim() || undefined;
}

export function getOplatumWebhookSecret(): string | undefined {
  return process.env.OPLATUM_WEBHOOK_SECRET?.trim() || undefined;
}

/** Имя заголовка подписи (Stripe: Stripe-Signature). */
export function getOplatumWebhookSignatureHeaderName(): string {
  return process.env.OPLATUM_WEBHOOK_SIGNATURE_HEADER?.trim() || "stripe-signature";
}

export function isOplatumBalanceTopUpConfigured(): boolean {
  return Boolean(getOplatumSecretKey() && getOplatumWebhookSecret());
}

export function allowDemoBalanceTopUpWithOplatum(): boolean {
  return process.env.ALLOW_DEMO_BALANCE_TOPUP === "true";
}
