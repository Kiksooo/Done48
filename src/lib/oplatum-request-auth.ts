import crypto from "node:crypto";

/**
 * Подпись REST-запросов Oplatum: X-Api-Key, X-Timestamp, X-Nonce, X-Signature.
 * Ошибка «Invalid signature format» чаще всего из‑за вида X-Signature (префикс v1= или Base64).
 * См. OPLATUM_SIGNATURE_VARIANT в .env.example.
 */

export type OplatumSignedHeaders = {
  "X-Api-Key": string;
  "X-Timestamp": string;
  "X-Nonce": string;
  "X-Signature": string;
};

function sha256Hex(body: string): string {
  return crypto.createHash("sha256").update(body, "utf8").digest("hex");
}

function hmacSha256(secret: string, message: string, encoding: "base64" | "hex"): string {
  return crypto.createHmac("sha256", secret).update(message, "utf8").digest(encoding);
}

function resolveSignatureVariant(): string {
  const v = process.env.OPLATUM_SIGNATURE_VARIANT?.trim().toLowerCase();
  if (v) return v;
  return "raw_hex";
}

/**
 * @param pathWithQuery — pathname + optional ?query (как на сервере)
 */
export function buildOplatumSignedHeaders(params: {
  method: string;
  pathWithQuery: string;
  body: string;
  apiKey: string;
  apiSecret: string;
}): OplatumSignedHeaders {
  const variant = resolveSignatureVariant();

  let pathname = params.pathWithQuery;
  let query = "";
  const q = params.pathWithQuery.indexOf("?");
  if (q !== -1) {
    pathname = params.pathWithQuery.slice(0, q);
    query = params.pathWithQuery.slice(q + 1);
  }

  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID();
  const bodyHash = sha256Hex(params.body);
  const canonical = [params.method.toUpperCase(), pathname, query, ts, nonce, bodyHash].join("\n");

  const b64 = hmacSha256(params.apiSecret, canonical, "base64");
  const hx = hmacSha256(params.apiSecret, canonical, "hex");

  let xSignature: string;
  switch (variant) {
    case "raw_hex":
      xSignature = hx;
      break;
    case "raw_base64":
    case "base64_no_prefix":
      xSignature = b64;
      break;
    case "v1_hex":
    case "hex":
      // hex — старое имя (v1= + hex); для подписи без префикса используйте raw_hex
      xSignature = `v1=${hx}`;
      break;
    case "v1_base64":
      xSignature = `v1=${b64}`;
      break;
    default:
      xSignature = hx;
      break;
  }

  return {
    "X-Api-Key": params.apiKey,
    "X-Timestamp": ts,
    "X-Nonce": nonce,
    "X-Signature": xSignature,
  };
}
