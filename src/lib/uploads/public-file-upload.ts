import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { objectStorageConfigured, putPublicObject } from "@/lib/uploads/object-storage";

/**
 * Куда уходят публичные загрузки (аватар, чат, портфолио).
 * — `blob`: Vercel Blob (переменная BLOB_READ_WRITE_TOKEN, обычно подставляется Vercel при подключении Storage).
 * — `s3`: S3-совместимое хранилище (Yandex / AWS / MinIO).
 * — `local`: каталог public/uploads (для dev; на serverless prod обычно не подходит).
 */
export type PublicUploadMode = "blob" | "s3" | "local";

export function getPublicUploadMode(): PublicUploadMode {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return "blob";
  if (objectStorageConfigured()) return "s3";
  return "local";
}

/**
 * Сохраняет файл и возвращает публичный URL (https… для blob/s3, /uploads/… для local).
 * @param logicalPath путь относительно /uploads без ведущего слэша, напр. `avatars/a.jpg`, `chat-orders/{id}/f.pdf`
 */
export async function savePublicUploadedFile(params: {
  logicalPath: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const logicalPath = params.logicalPath.replace(/^\/+/, "");
  if (!logicalPath || logicalPath.includes("..")) {
    throw new Error("Invalid upload path");
  }

  const mode = getPublicUploadMode();
  if (mode === "blob") {
    const blob = await put(logicalPath, params.body, {
      access: "public",
      contentType: params.contentType,
    });
    return blob.url;
  }
  if (mode === "s3") {
    return putPublicObject({
      key: logicalPath,
      body: params.body,
      contentType: params.contentType,
    });
  }

  const fsPath = path.join(process.cwd(), "public", "uploads", ...logicalPath.split("/"));
  await mkdir(path.dirname(fsPath), { recursive: true });
  await writeFile(fsPath, params.body);
  return `/uploads/${logicalPath}`;
}
