import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Регистрация — DONE48",
  description: "Создайте аккаунт DONE48: заказывайте услуги или выполняйте задачи в одном сервисе.",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Регистрация — DONE48",
    description: "Создайте аккаунт DONE48: заказывайте услуги или выполняйте задачи в одном сервисе.",
    url: "/register",
  },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
