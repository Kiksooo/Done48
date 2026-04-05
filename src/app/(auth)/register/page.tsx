import type { Metadata } from "next";
import { parseRegisterRoleFromSearchParam } from "@/lib/register-intent";
import { RegisterForm } from "./register-form";

function pickSearchParamRef(raw: string | string[] | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const s = Array.isArray(raw) ? raw[0] : raw;
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > 0 ? t : undefined;
}

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
  searchParams: { ref?: string | string[]; role?: string | string[] };
}) {
  const ref = pickSearchParamRef(searchParams.ref);
  const defaultRole = parseRegisterRoleFromSearchParam(searchParams.role);
  return <RegisterForm referralCode={ref} defaultRole={defaultRole} />;
}
