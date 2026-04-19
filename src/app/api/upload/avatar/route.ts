import { NextResponse } from "next/server";
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
  if (!user) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
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

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "Файл больше 2 МБ" }, { status: 400 });
    }

    const name = `${user.id}-${Date.now()}.${ext}`;
    const logicalPath = `avatars/${name}`;

    try {
      const url = await savePublicUploadedFile({
        logicalPath,
        body: buf,
        contentType: mime,
      });
      return NextResponse.json({ url });
    } catch (e) {
      console.error("[upload/avatar]", getPublicUploadMode(), e);
      const mode = getPublicUploadMode();
      if (mode === "local" && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            error:
              "На production нужно хранилище файлов: в Vercel подключите Blob (BLOB_READ_WRITE_TOKEN) или задайте S3_* переменные.",
          },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: "Не удалось сохранить файл в хранилище" }, { status: 502 });
    }
  } catch (e) {
    console.error("[upload/avatar] unexpected", e);
    return NextResponse.json({ error: "Внутренняя ошибка загрузки" }, { status: 500 });
  }
}
