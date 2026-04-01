"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { sendSupportMessageAction, sendSupportReplyAction } from "@/server/actions/support-chat";

export type SupportChatMessageView = {
  id: string;
  author: "user" | "admin";
  text: string;
  createdAtIso: string;
};

type Props = {
  messages: SupportChatMessageView[];
  mode: "user" | "admin";
  targetUserId?: string;
};

export function SupportChatPanel({ messages, mode, targetUserId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const canSend = useMemo(() => {
    const len = message.trim().length;
    return len >= (mode === "admin" ? 2 : 4);
  }, [message, mode]);

  function onSend() {
    if (!canSend || pending) return;
    setStatus(null);
    const payload = message.trim();
    startTransition(async () => {
      const res =
        mode === "admin"
          ? await sendSupportReplyAction(targetUserId ?? "", payload)
          : await sendSupportMessageAction(payload);
      if (!res.ok) {
        setStatus(res.error ?? "Не удалось отправить");
        return;
      }
      setMessage("");
      setStatus("Отправлено");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет сообщений. Напишите первым.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-xl border px-3 py-2 text-sm",
                  m.author === "admin"
                    ? "border-primary/25 bg-primary/5 text-foreground"
                    : "ml-auto border-border bg-muted/35 text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(m.createdAtIso).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-foreground">
          {mode === "admin" ? "Ответ админа" : "Ваше сообщение"}
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={mode === "admin" ? "Напишите ответ пользователю…" : "Опишите вопрос, и админ ответит в чате."}
          className="min-h-[110px]"
          disabled={pending}
        />
        <div className="mt-3 flex items-center gap-3">
          <Button type="button" onClick={onSend} disabled={pending || !canSend}>
            {pending ? "Отправка..." : "Отправить"}
          </Button>
          {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
        </div>
      </div>
    </div>
  );
}
