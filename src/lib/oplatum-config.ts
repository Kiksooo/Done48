/**
 * Oplatum: ключи в кабинете (ak_live / sk_live / whsec_).
 * HTTP совместим со Stripe API (Checkout Session + подпись вебхука).
 *
 * Важно: хост api.oplatum.com в DNS не существует — базовый URL API нужно взять из ЛК Oplatum
 * и задать в OPLATUM_API_BASE_URL.
 */

/** База API без завершающего слэша, без /v1 (пример: https://pay.example.com). */
export function getOplatumApiBaseUrl(): string | undefined {
  const raw = process.env.OPLATUM_API_BASE_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

/** Серверный секрет (sk_live_…), если выдан отдельно от API Key. */
export function getOplatumSecretKey(): string | undefined {
  return process.env.OPLATUM_SECRET_KEY?.trim() || undefined;
}

/** Публичный/серверный API Key (ak_live_…) — для Bearer, если нет sk. */
export function getOplatumApiKey(): string | undefined {
  return process.env.OPLATUM_API_KEY?.trim() || undefined;
}

/** Токен для Authorization: Bearer … (опционально, если касса просит и Bearer, и подпись). */
export function getOplatumBearerToken(): string | undefined {
  return getOplatumSecretKey() ?? getOplatumApiKey();
}

/**
 * Секрет для HMAC (X-Signature). Обычно sk_live_… из ЛК.
 * Переопределение: OPLATUM_HMAC_SECRET. Если задано OPLATUM_SIGN_WITH_API_KEY=true — fallback на API Key.
 */
export function getOplatumHmacSecret(): string | undefined {
  const explicit = process.env.OPLATUM_HMAC_SECRET?.trim();
  if (explicit) return explicit;
  const sk = getOplatumSecretKey();
  if (sk) return sk;
  if (process.env.OPLATUM_SIGN_WITH_API_KEY === "true") {
    return getOplatumApiKey();
  }
  return undefined;
}

export function getOplatumWebhookSecret(): string | undefined {
  return process.env.OPLATUM_WEBHOOK_SECRET?.trim() || undefined;
}

/** Имя заголовка подписи (Stripe: Stripe-Signature). */
export function getOplatumWebhookSignatureHeaderName(): string {
  return process.env.OPLATUM_WEBHOOK_SIGNATURE_HEADER?.trim() || "stripe-signature";
}

export function isOplatumBalanceTopUpConfigured(): boolean {
  return Boolean(
    getOplatumWebhookSecret() &&
      getOplatumApiBaseUrl() &&
      getOplatumApiKey() &&
      getOplatumHmacSecret(),
  );
}

export function allowDemoBalanceTopUpWithOplatum(): boolean {
  return process.env.ALLOW_DEMO_BALANCE_TOPUP === "true";
}

/**
 * Способы оплаты в Checkout (Stripe-совместимые payment_method_types).
 * По умолчанию только СБП. Если касса вернёт ошибку — см. доку Oplatum или попробуйте `sbp,card` или другое имя метода из ЛК.
 */
export function getOplatumPaymentMethodTypes(): string[] {
  const raw = process.env.OPLATUM_PAYMENT_METHOD_TYPES?.trim();
  if (!raw) return ["sbp"];
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : ["sbp"];
}

/** Подпись кнопки пополнения под выбранные методы. */
export function getOplatumCheckoutButtonLabel(): string {
  const m = getOplatumPaymentMethodTypes();
  const lower = m.map((x) => x.toLowerCase());
  const set = new Set(lower);
  if (set.size === 1 && set.has("sbp")) return "Оплатить через СБП";
  if (set.size === 1 && set.has("card")) return "Оплатить картой";
  if (set.has("sbp") && set.has("card")) return "Оплатить (СБП или карта)";
  return "Перейти к оплате";
}
