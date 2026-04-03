import crypto from "node:crypto";

/**
 * Подпись REST-запросов Oplatum: X-Api-Key, X-Timestamp, X-Nonce, X-Signature.
 * Каноническая строка и Base64 HMAC — как в распространённых схемах (AllScale и др.);
 * при "Bad signature" см. OPLATUM_SIGNATURE_VARIANT в .env.example.
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
  const variant = process.env.OPLATUM_SIGNATURE_VARIANT?.trim() || "v1_base64";

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

  let xSignature: string;
  switch (variant) {
    case "hex":
      xSignature = `v1=${hmacSha256(params.apiSecret, canonical, "hex")}`;
      break;
    case "base64_no_prefix":
      xSignature = hmacSha256(params.apiSecret, canonical, "base64");
      break;
    case "v1_base64":
    default:
      xSignature = `v1=${hmacSha256(params.apiSecret, canonical, "base64")}`;
      break;
  }

  return {
    "X-Api-Key": params.apiKey,
    "X-Timestamp": ts,
    "X-Nonce": nonce,
    "X-Signature": xSignature,
  };
}
