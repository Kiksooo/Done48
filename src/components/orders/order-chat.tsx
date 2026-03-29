"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
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

type FormValues = { body: string; attachmentUrl: string };

export function OrderChat(props: {
  orderId: string;
  viewerId: string;
  canPost: boolean;
  initialMessages: OrderChatMessage[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    defaultValues: { body: "", attachmentUrl: "" },
  });

  useEffect(() => {
    void markChatReadAction(props.orderId);
  }, [props.orderId]);

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const res = await sendChatMessageAction({
        orderId: props.orderId,
        body: values.body,
        attachmentUrl: values.attachmentUrl || undefined,
      });
      if (res.ok) {
        form.reset();
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
                  {m.senderEmail ? ` · ${m.senderEmail}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                {m.attachmentUrl ? (
                  <a
                    href={m.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-2 inline-block text-xs underline ${isMine ? "text-white/90" : "text-neutral-600 dark:text-neutral-400"}`}
                  >
                    Вложение (ссылка)
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
            <Label htmlFor="chat-attach">Ссылка на файл (опционально)</Label>
            <Input
              id="chat-attach"
              type="url"
              placeholder="https://…"
              disabled={pending}
              {...form.register("attachmentUrl")}
            />
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
