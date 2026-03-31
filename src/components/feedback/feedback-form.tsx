"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { submitFeedbackAction } from "@/server/actions/feedback";
import { cn } from "@/lib/utils";

type Props = {
  /** Подставить email из сессии в кабинете. */
  defaultEmail?: string;
  defaultName?: string;
  className?: string;
};

export function FeedbackForm({ defaultEmail = "", defaultName = "", className }: Props) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function buildPayload() {
    return {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      message: message.trim(),
    };
  }

  return (
    <Card className={cn("overflow-hidden border-border shadow-sm", className)}>
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base">Написать в поддержку</CardTitle>
        <CardDescription>
          Сообщение уйдёт администраторам платформы как уведомление — ответ придёт на указанную почту или в уведомлениях, если
          решим ответить через систему.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            startTransition(async () => {
              const r = await submitFeedbackAction(buildPayload());
              if (!r.ok) {
                setMsg(r.error ?? "Ошибка отправки");
                return;
              }
              setMsg("Спасибо! Сообщение отправлено — скоро вернёмся с ответом.");
              setMessage("");
            });
          }}
        >
          {msg ? (
            <p
              className={
                msg.includes("Спасибо")
                  ? "text-sm font-medium text-emerald-800 dark:text-emerald-300"
                  : "text-sm font-medium text-red-600 dark:text-red-400"
              }
              role="status"
            >
              {msg}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fb-name">Имя (необязательно)</Label>
              <Input id="fb-name" value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-email">Эл. почта (необязательно)</Label>
              <Input
                id="fb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                placeholder="primer@pochta.ru"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fb-message">Сообщение</Label>
            <Textarea
              id="fb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={pending}
              placeholder="Опишите вопрос или предложение. Чем подробнее — тем проще помочь."
              className="min-h-[120px]"
            />
          </div>

          <Button type="submit" disabled={pending || message.trim().length < 20} className="w-full sm:w-auto">
            {pending ? "Отправка…" : "Отправить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
