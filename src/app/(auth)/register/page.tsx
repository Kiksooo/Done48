import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте аккаунт DONE48: заказывайте услуги или выполняйте задачи в одном сервисе.",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Регистрация",
    description: "Создайте аккаунт DONE48: заказывайте услуги или выполняйте задачи в одном сервисе.",
    url: "/register",
  },
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const ref = searchParams.ref?.trim() || undefined;
  return <RegisterForm referralCode={ref} />;
}
