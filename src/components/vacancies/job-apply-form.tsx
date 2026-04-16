"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { submitJobApplicationAction } from "@/server/actions/job-application";
import { Button } from "@/components/ui/button";
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

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Откликнуться</h2>
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      {ok ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Спасибо! Отклик отправлен — мы свяжемся по email.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ja-name">Имя и фамилия</Label>
          <Input
            id="ja-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={pending}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ja-email">Email</Label>
          <Input
            id="ja-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ja-phone">Телефон (необязательно)</Label>
        <Input
          id="ja-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={pending}
          autoComplete="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ja-letter">Сопроводительное письмо</Label>
        <Textarea
          id="ja-letter"
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          disabled={pending}
          rows={8}
          required
          placeholder="Коротко о себе, релевантный опыт и ссылки на работы (если есть)."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ja-resume">Ссылка на резюме (необязательно)</Label>
        <Input
          id="ja-resume"
          type="url"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          disabled={pending}
          placeholder="https://…"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Отправка…" : "Отправить отклик"}
      </Button>
    </form>
  );
}
