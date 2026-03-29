"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithTokenAction } from "@/server/actions/password-reset";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый пароль</CardTitle>
        <CardDescription>Введите пароль не короче 8 символов.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setErr(null);
            if (password !== password2) {
              setErr("Пароли не совпадают");
              return;
            }
            startTransition(async () => {
              const r = await resetPasswordWithTokenAction({ token, password });
              if (!r.ok) {
                setErr(r.error);
                return;
              }
              router.push("/login?reset=1");
              router.refresh();
            });
          }}
        >
          {err ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {err}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="np1">Новый пароль</Label>
            <Input
              id="np1"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="np2">Повтор пароля</Label>
            <Input
              id="np2"
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              minLength={8}
              disabled={pending}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Сохранение…" : "Сохранить пароль"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Ко входу
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
