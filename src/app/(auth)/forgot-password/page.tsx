import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  description: "Запросите ссылку для сброса пароля в DONE48.",
  alternates: { canonical: "/forgot-password" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Восстановление пароля",
    description: "Запросите ссылку для сброса пароля в DONE48.",
    url: "/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
