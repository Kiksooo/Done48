/**
 * Разбор объекта checkout session (вебхук Oplatum / ответ GET session) → зачисление.
 */

export function isOplatumRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function isCheckoutSessionCompletedEventType(type: string | undefined): boolean {
  if (!type) return false;
  const t = type.toLowerCase().trim();
  return t === "checkout.session.completed" || t === "checkout_session.completed";
}

function parseAmountMajorUnitsToKopecks(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.round(v * 100);
  }
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 100);
  }
  return null;
}

function parseMinorUnitsAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    return Math.round(v);
  }
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n);
  }
  return null;
}

function amountFromCheckoutPayload(o: Record<string, unknown>): number | null {
  for (const k of ["amount_total", "amountTotal", "amount_cents", "amountCents"]) {
    const parsed = parseMinorUnitsAmount(o[k]);
    if (parsed != null) return parsed;
  }
  for (const k of ["amount", "total"]) {
    const parsed = parseAmountMajorUnitsToKopecks(o[k]);
    if (parsed != null && parsed > 0) return parsed;
  }
  return null;
}

/** Достаёт объект сессии из тела вебхука или JSON ответа Merchant API. */
export function checkoutSessionObjectFromJson(json: unknown): Record<string, unknown> | null {
  if (!isOplatumRecord(json)) return null;
  if (isOplatumRecord(json.data)) {
    if (isOplatumRecord(json.data.object)) return json.data.object;
    return json.data;
  }
  if (isOplatumRecord(json.result)) return json.result;
  if (isOplatumRecord(json.payload)) return json.payload;
  return json;
}

export type CheckoutSessionFulfillmentState = {
  sessionId: string;
  paid: boolean;
  amountKopecks: number | null;
};

/**
 * @param fallbackSessionId — если в объекте нет id (редкий ответ API), подставить из URL запроса.
 */
export function parseCheckoutSessionFulfillmentState(
  o: Record<string, unknown>,
  fallbackSessionId?: string,
): CheckoutSessionFulfillmentState | null {
  const sessionId =
    typeof o.sessionId === "string"
      ? o.sessionId
      : typeof o.id === "string"
        ? o.id
        : typeof o.checkout_session_id === "string"
          ? o.checkout_session_id
          : fallbackSessionId && fallbackSessionId.length > 0
            ? fallbackSessionId
            : "";
  if (!sessionId) {
    return null;
  }
  const status = typeof o.status === "string" ? o.status.toLowerCase() : "";
  const paymentStatus =
    typeof o.payment_status === "string"
      ? o.payment_status.toLowerCase()
      : typeof o.paymentStatus === "string"
        ? o.paymentStatus.toLowerCase()
        : "";
  const explicitlyUnpaid =
    paymentStatus === "unpaid" ||
    paymentStatus === "requires_payment_method" ||
    status === "open" ||
    status === "expired";
  let paid =
    status === "complete" ||
    status === "completed" ||
    status === "paid" ||
    paymentStatus === "paid" ||
    paymentStatus === "complete" ||
    (status === "" && paymentStatus === "");
  if (explicitlyUnpaid) {
    paid = false;
  }
  return {
    sessionId,
    paid,
    amountKopecks: amountFromCheckoutPayload(o),
  };
}

export function fulfillmentFromWebhookEvent(event: {
  type?: string;
  data?: unknown;
}): CheckoutSessionFulfillmentState | null {
  if (!isCheckoutSessionCompletedEventType(event.type)) {
    return null;
  }
  const o = checkoutSessionObjectFromJson(event);
  if (!o) return null;
  return parseCheckoutSessionFulfillmentState(o);
}
