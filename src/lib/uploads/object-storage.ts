import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * S3-совместимое хранилище (AWS S3, MinIO, Yandex Object Storage, Selectel и т.д.).
 * Если не заданы S3_BUCKET + ключи + S3_PUBLIC_BASE_URL — загрузки идут в public/uploads локально.
 */

export function objectStorageConfigured(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY?.trim() &&
      process.env.S3_SECRET_KEY?.trim() &&
      process.env.S3_PUBLIC_BASE_URL?.trim(),
  );
}

let cachedClient: S3Client | null = null;

function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const endpoint = process.env.S3_ENDPOINT?.trim();
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE === "true" ||
    Boolean(endpoint && !endpoint.includes("amazonaws.com"));
  cachedClient = new S3Client({
    region: process.env.S3_REGION?.trim() || "us-east-1",
    ...(endpoint ? { endpoint } : {}),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle,
  });
  return cachedClient;
}

/** Загрузка объекта; bucket должен отдавать файлы по S3_PUBLIC_BASE_URL (политика / CDN). */
export async function putPublicObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const bucket = process.env.S3_BUCKET!.trim();
  const base = process.env.S3_PUBLIC_BASE_URL!.trim().replace(/\/$/, "");
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
  return `${base}/${params.key}`;
}

/** URL вложения чата: локальный префикс или объект из нашего bucket (origin как у S3_PUBLIC_BASE_URL). */
export function isTrustedChatUploadUrl(orderId: string, rawUrl: string): boolean {
  if (rawUrl.includes("..")) return false;
  const localPrefix = `/uploads/chat-orders/${orderId}/`;
  if (rawUrl.startsWith(localPrefix)) return true;
  const baseRaw = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (!baseRaw) return false;
  try {
    const parsed = new URL(rawUrl);
    const base = new URL(baseRaw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (parsed.origin !== base.origin) return false;
    const norm = parsed.pathname.replace(/^\/+/, "");
    return norm.includes(`chat-orders/${orderId}/`);
  } catch {
    return false;
  }
}
