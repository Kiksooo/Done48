"use client";

import type { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { orderChatMessageSenderLine } from "@/lib/order-contact-privacy";
import { markChatReadAction, sendChatMessageAction } from "@/server/actions/chat";

export type OrderChatMessage = {
  id: string;
  kind: "USER" | "SYSTEM";
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
  senderId: string | null;
  senderEmail: string | null;
};

type FormValues = { body: string };

export function OrderChat(props: {
  orderId: string;
  viewerId: string;
  viewerRole: Role;
  customerId: string;
  executorId: string | null;
  canPost: boolean;
  initialMessages: OrderChatMessage[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const form = useForm<FormValues>({
    defaultValues: { body: "" },
  });

  useEffect(() => {
    void markChatReadAction(props.orderId);
  }, [props.orderId]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      let attachmentUrl: string | undefined;
      if (pickedFile) {
        const fd = new FormData();
        fd.set("orderId", props.orderId);
        fd.set("file", pickedFile);
        const up = await fetch("/api/upload/chat", { method: "POST", body: fd });
        const data = (await up.json().catch(() => ({}))) as { error?: string; url?: string };
        if (!up.ok) {
          form.setError("root", { message: data.error ?? "Не удалось загрузить файл" });
          return;
        }
        if (data.url) {
          attachmentUrl = data.url;
        }
      }

      const res = await sendChatMessageAction({
        orderId: props.orderId,
        body: values.body,
        attachmentUrl,
      });
      if (res.ok) {
        form.reset();
        setPickedFile(null);
        router.refresh();
      } else {
        form.setError("root", { message: res.error });
      }
    });
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Чат по заказу</h2>
        {props.unreadCount > 0 ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950 dark:bg-amber-900/40 dark:text-amber-100">
            Новых: {props.unreadCount}
          </span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => router.refresh()}
        >
          Обновить
        </Button>
      </div>

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-900 dark:bg-neutral-900/30">
        {props.initialMessages.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Пока нет сообщений. Системные уведомления о смене статуса появляются автоматически.
          </p>
        ) : null}
        {props.initialMessages.map((m) => {
          if (m.kind === "SYSTEM") {
            return (
              <div key={m.id} className="flex justify-center">
                <p className="max-w-[95%] rounded-md bg-neutral-200/80 px-3 py-1.5 text-center text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {formatDateTime(m.createdAt)} · {m.body}
                </p>
              </div>
            );
          }

          const isMine = m.senderId === props.viewerId;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  isMine
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
                }`}
              >
                <p className="text-xs opacity-80">
                  {formatDateTime(m.createdAt)}
                  {" · "}
                  {orderChatMessageSenderLine({
                    viewerRole: props.viewerRole,
                    viewerId: props.viewerId,
                    customerId: props.customerId,
                    executorId: props.executorId,
                    senderId: m.senderId,
                    senderEmail: m.senderEmail,
                  })}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                {m.attachmentUrl ? (
                  <a
                    href={m.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-2 inline-block text-xs underline ${isMine ? "text-white/90" : "text-neutral-600 dark:text-neutral-400"}`}
                  >
                    {m.attachmentUrl.startsWith("/uploads/") || m.attachmentUrl.includes("/chat-orders/")
                      ? "Скачать вложение"
                      : "Вложение (ссылка)"}
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {props.canPost ? (
        <form className="mt-4 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          {form.formState.errors.root ? (
            <p className="text-sm text-red-600" role="alert">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="chat-body">Сообщение</Label>
            <Textarea
              id="chat-body"
              rows={3}
              disabled={pending}
              {...form.register("body", { required: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chat-attach">Файл (опционально)</Label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              До 10 МБ: изображения, PDF, ZIP, TXT или DOCX. Файл отправится на сервер при нажатии «Отправить».
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={pending} asChild>
                <label className="cursor-pointer">
                  Выбрать файл
                  <input
                    id="chat-attach"
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf,application/zip,.zip,text/plain,.txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={pending}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setPickedFile(f);
                    }}
                  />
                </label>
              </Button>
              {pickedFile ? (
                <span className="max-w-[min(100%,240px)] truncate text-xs text-neutral-600 dark:text-neutral-400">
                  {pickedFile.name}
                </span>
              ) : null}
              {pickedFile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => setPickedFile(null)}
                >
                  Убрать
                </Button>
              ) : null}
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Отправка…" : "Отправить"}
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Отправка сообщений доступна заказчику, назначенному исполнителю и администратору.
        </p>
      )}
    </section>
  );
}
