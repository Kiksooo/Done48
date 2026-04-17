"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { CheckCircle2, Mail, Paperclip, Send, User } from "lucide-react";
import { submitJobApplicationAction } from "@/server/actions/job-application";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  vacancySlug: string;
};

export function JobApplyForm({ vacancySlug }: Props) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(false);
    startTransition(async () => {
      const r = await submitJobApplicationAction(vacancySlug, {
        fullName,
        email,
        phone,
        coverLetter,
        resumeUrl,
      });
      if (!r.ok) {
        setMsg(r.error ?? "Ошибка");
        return;
      }
      setOk(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setCoverLetter("");
      setResumeUrl("");
    });
  }

  if (ok) {
    return (
      <Card className="overflow-hidden rounded-2xl border-emerald-500/25 bg-gradient-to-b from-emerald-500/10 to-card shadow-md ring-1 ring-emerald-500/20">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center sm:px-10">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-8" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="max-w-md space-y-2">
            <p className="text-lg font-semibold tracking-tight text-foreground">Отклик отправлен</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Спасибо за интерес к роли. Мы получили ваше сообщение и свяжемся по email, если профиль подойдёт под
              задачу команды.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 shadow-md ring-1 ring-border/60">
      <div
        className="h-1 bg-gradient-to-r from-primary/70 via-primary/30 to-transparent"
        aria-hidden
      />
      <CardHeader className="space-y-3 pb-2 pt-6 sm:pt-8">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Send className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">Откликнуться</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Заполните форму — ответим на указанный email. Обычно это занимает пару минут.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-8 sm:px-8">
        {msg ? (
          <p
            className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/35 dark:text-red-100"
            role="alert"
          >
            {msg}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ja-name" className="inline-flex items-center gap-2 text-foreground">
                <User className="size-3.5 text-muted-foreground" aria-hidden />
                Имя и фамилия
              </Label>
              <Input
                id="ja-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={pending}
                required
                autoComplete="name"
                placeholder="Как к вам обращаться"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ja-email" className="inline-flex items-center gap-2 text-foreground">
                <Mail className="size-3.5 text-muted-foreground" aria-hidden />
                Email
              </Label>
              <Input
                id="ja-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ja-phone" className="text-foreground">
              Телефон{" "}
              <span className="font-normal text-muted-foreground">— по желанию, для быстрой связи</span>
            </Label>
            <Input
              id="ja-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={pending}
              autoComplete="tel"
              placeholder="+7 …"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ja-letter" className="text-foreground">
              Сопроводительное письмо
            </Label>
            <Textarea
              id="ja-letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              disabled={pending}
              rows={7}
              required
              placeholder="Коротко о себе, релевантный опыт, почему интересна именно эта роль. Можно добавить ссылки на работы или GitHub."
              className="min-h-[160px] resize-y leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">Чем конкретнее — тем проще нам понять совпадение.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ja-resume" className="inline-flex items-center gap-2 text-foreground">
              <Paperclip className="size-3.5 text-muted-foreground" aria-hidden />
              Ссылка на резюме{" "}
              <span className="font-normal text-muted-foreground">— необязательно</span>
            </Label>
            <Input
              id="ja-resume"
              type="url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              disabled={pending}
              placeholder="https://…"
              className="h-11 font-mono text-sm"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-sm">
              Нажимая «Отправить», вы соглашаетесь с тем, что мы используем эти данные только для отбора по этой
              вакансии.
            </p>
            <Button type="submit" size="lg" disabled={pending} className="shrink-0 gap-2 sm:min-w-[11rem]">
              {pending ? (
                "Отправка…"
              ) : (
                <>
                  <Send className="size-4" aria-hidden />
                  Отправить отклик
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
