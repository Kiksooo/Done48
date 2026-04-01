import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Вход в кабинет",
  description: "Войдите в аккаунт DONE48 как заказчик или исполнитель.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Вход в кабинет",
    description: "Войдите в аккаунт DONE48 как заказчик или исполнитель.",
    url: "/login",
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Загрузка…</p>}>
      <LoginForm />
    </Suspense>
  );
}
