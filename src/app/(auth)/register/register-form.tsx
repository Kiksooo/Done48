"use client";

import type { Role } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser, type RegisterState } from "@/server/actions/register";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Создание…" : "Создать аккаунт бесплатно"}
    </Button>
  );
}

type RegisterFormProps = {
  referralCode?: string;
  /** Из `?role=` на `/register` (например, с кнопки «Искать заказы как исполнитель»). */
  defaultRole?: Extract<Role, "CUSTOMER" | "EXECUTOR">;
};

export function RegisterForm({ referralCode, defaultRole }: RegisterFormProps) {
  const router = useRouter();
  const initialRole = defaultRole ?? "CUSTOMER";
  const [state, formAction] = useFormState<RegisterState | undefined, FormData>(
    registerUser,
    undefined,
  );
  const [landingTaskHint, setLandingTaskHint] = useState<string | null>(null);

  useEffect(() => {
    if (state?.ok) {
      router.push("/login?registered=1");
    }
  }, [state, router]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("done48.landingTaskHint");
      if (raw?.trim()) {
        setLandingTaskHint(raw.trim());
        sessionStorage.removeItem("done48.landingTaskHint");
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Создайте аккаунт</CardTitle>
        <CardDescription>
          Минутка — и можно публиковать заказы или откликаться на них. Роль выберите ниже; в онбординге — только краткая справка по кабинету. Регистрация бесплатна.
        </CardDescription>
        {defaultRole === "EXECUTOR" ? (
          <p className="mt-3 rounded-lg border border-primary/15 bg-primary/[0.06] px-3 py-2 text-sm text-foreground dark:bg-primary/[0.09]">
            Роль «Исполнитель» подставлена по ссылке с главной. При необходимости смените в поле ниже до отправки
            формы.
          </p>
        ) : null}
        {landingTaskHint ? (
          <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
            С главной вы искали: «{landingTaskHint}». После регистрации перенесите это в описание заказа или в отклик.
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={formAction}>
          {referralCode ? <input type="hidden" name="ref" value={referralCode} /> : null}
          {state && !state.ok && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Эл. почта</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            {state && !state.ok && state.fieldErrors?.email?.[0] && (
              <p className="text-sm text-red-600">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            {state && !state.ok && state.fieldErrors?.password?.[0] && (
              <p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <select
              id="role"
              name="role"
              required
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
              defaultValue={initialRole}
            >
              <option value="CUSTOMER">Заказчик</option>
              <option value="EXECUTOR">Исполнитель</option>
            </select>
            {state && !state.ok && state.fieldErrors?.role?.[0] && (
              <p className="text-sm text-red-600">{state.fieldErrors.role[0]}</p>
            )}
          </div>
          <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <label className="flex cursor-pointer gap-2 text-sm leading-snug text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                name="acceptTerms"
                value="on"
                required
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400"
              />
              <span>
                Принимаю{" "}
                <Link
                  href="/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  пользовательское соглашение
                </Link>
                ,{" "}
                <Link
                  href="/legal/fees"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  правила комиссий и расчётов
                </Link>{" "}
                и{" "}
                <Link
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  политику конфиденциальности
                </Link>
                .
              </span>
            </label>
            {state && !state.ok && state.fieldErrors?.acceptTerms?.[0] && (
              <p className="text-sm text-red-600">{state.fieldErrors.acceptTerms[0]}</p>
            )}
            <label className="flex cursor-pointer gap-2 text-sm leading-snug text-neutral-600 dark:text-neutral-400">
              <input
                type="checkbox"
                name="marketingOptIn"
                value="on"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-400"
              />
              <span>
                Согласен(на) получать новости и предложения по email — как описано в{" "}
                <Link
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  политике персональных данных
                </Link>
                . Отписка доступна в профиле и на странице{" "}
                <Link
                  href="/legal/unsubscribe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  отписки от рассылки
                </Link>
                .
              </span>
            </label>
          </div>
          <SubmitButton />
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-neutral-900 underline dark:text-neutral-100">
              Войти
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
