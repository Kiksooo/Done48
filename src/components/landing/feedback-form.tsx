"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { submitFeedbackAction } from "@/server/actions/feedback";

export function FeedbackForm() {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
    <Card className="mt-6 overflow-hidden border-border/80 bg-card/60 shadow-none backdrop-blur-sm">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">Обратная связь</CardTitle>
        <CardDescription>Напишите, что нужно — администраторы увидят сообщение в кабинете.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
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
              <Label htmlFor="fb-email">Email (необязательно)</Label>
              <Input
                id="fb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                placeholder="name@email.ru"
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
              placeholder="Опишите вопрос/предложение. Чем подробнее — тем быстрее ответим."
              className="min-h-[110px]"
            />
          </div>

          <Button type="submit" disabled={pending || message.trim().length < 20} className="w-full">
            {pending ? "Отправка..." : "Отправить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

