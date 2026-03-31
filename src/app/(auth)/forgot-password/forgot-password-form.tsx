"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_RESET_REQUEST_SUCCESS } from "@/schemas/auth";
import { requestPasswordResetAction } from "@/server/actions/password-reset";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сброс пароля</CardTitle>
        <CardDescription>Укажите email — пришлём ссылку для нового пароля.</CardDescription>
      </CardHeader>
      <CardContent>
        {msg ? (
          <p className="mb-4 text-sm text-green-700 dark:text-green-400" role="status">
            {msg}
          </p>
        ) : null}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            setMsg(null);
            startTransition(async () => {
              const r = await requestPasswordResetAction({ email });
              if (!r.ok) {
                setErr(r.error);
                return;
              }
              setMsg(PASSWORD_RESET_REQUEST_SUCCESS);
            });
          }}
        >
          {err ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {err}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="fp-email">Эл. почта</Label>
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={pending || Boolean(msg)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending || Boolean(msg)}>
            {pending ? "Отправка…" : "Отправить ссылку"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              ← Назад ко входу
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
