import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { getPublicUploadMode, savePublicUploadedFile } from "@/lib/uploads/public-file-upload";
import { assertOrderReadable } from "@/server/orders/access";
import { canPostOrderChat } from "@/server/orders/customer-partners";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["application/pdf", "pdf"],
  ["application/zip", "zip"],
  ["text/plain", "txt"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
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

  const orderIdRaw = form.get("orderId");
  const orderId = typeof orderIdRaw === "string" ? orderIdRaw.trim() : "";
  if (!orderId) {
    return NextResponse.json({ error: "Не указан заказ" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файл больше 10 МБ" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, executorId: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
  }

  const access = await assertOrderReadable({
    orderId: order.id,
    userId: user.id,
    role: user.role as Role,
  });
  if (!access.ok) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  if (!(await canPostOrderChat(user.id, user.role as Role, order))) {
    return NextResponse.json({ error: "Нет права прикреплять файлы в этом чате" }, { status: 403 });
  }

  const mime = file.type || "application/octet-stream";
  const ext = ALLOWED.get(mime);
  if (!ext) {
    return NextResponse.json(
      { error: "Допустимы изображения, PDF, ZIP, TXT или DOCX (до 10 МБ)" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ error: "Файл больше 10 МБ" }, { status: 400 });
  }

  const name = `${user.id}-${Date.now()}.${ext}`;
  const logicalPath = `chat-orders/${orderId}/${name}`;

  try {
    const url = await savePublicUploadedFile({
      logicalPath,
      body: buf,
      contentType: mime,
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[upload/chat]", getPublicUploadMode(), e);
    return NextResponse.json({ error: "Не удалось сохранить файл в хранилище" }, { status: 502 });
  }
}
