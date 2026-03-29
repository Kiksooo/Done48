"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser, type RegisterState } from "@/server/actions/register";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Создание…" : "Зарегистрироваться"}
    </Button>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useFormState<RegisterState | undefined, FormData>(
    registerUser,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) {
      router.push("/login?registered=1");
    }
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
        <CardDescription>Заказчик или исполнитель. Админов добавляет только платформа.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={formAction}>
          {state && !state.ok && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {state.error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
              defaultValue="CUSTOMER"
            >
              <option value="CUSTOMER">Заказчик</option>
              <option value="EXECUTOR">Исполнитель</option>
            </select>
            {state && !state.ok && state.fieldErrors?.role?.[0] && (
              <p className="text-sm text-red-600">{state.fieldErrors.role[0]}</p>
            )}
          </div>
          <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            Нажимая «Зарегистрироваться», вы принимаете{" "}
            <Link href="/legal/terms" className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
              пользовательское соглашение
            </Link>{" "}
            и{" "}
            <Link href="/legal/privacy" className="font-medium text-neutral-900 underline underline-offset-2 dark:text-neutral-100">
              политику конфиденциальности
            </Link>
            .
          </p>
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
