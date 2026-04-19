import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getSessionUserForAction } from "@/lib/rbac";
import { getPublicUploadMode, savePublicUploadedFile } from "@/lib/uploads/public-file-upload";

export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(req: Request) {
  const user = await getSessionUserForAction();
  if (!user || user.role !== Role.EXECUTOR) {
    return NextResponse.json({ error: "Нужна авторизация специалиста" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл больше 2 МБ" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED.get(mime);
  if (!ext) {
    return NextResponse.json({ error: "Допустимы JPEG, PNG, WebP или GIF" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "Файл больше 2 МБ" }, { status: 400 });
  }

  const name = `${user.id}-${Date.now()}.${ext}`;
  const logicalPath = `portfolio/${name}`;

  try {
    const url = await savePublicUploadedFile({
      logicalPath,
      body: buf,
      contentType: mime,
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[upload/portfolio]", getPublicUploadMode(), e);
    return NextResponse.json({ error: "Не удалось сохранить файл в хранилище" }, { status: 502 });
  }
}
