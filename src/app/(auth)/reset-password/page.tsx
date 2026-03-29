import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

type Props = { searchParams: { token?: string } };

export default function ResetPasswordPage({ searchParams }: Props) {
  const token = searchParams.token?.trim() ?? "";

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-card p-6 text-center text-sm dark:border-neutral-800">
            <p className="text-neutral-700 dark:text-neutral-300">
              Ссылка неполная. Откройте адрес из письма или{" "}
              <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
                запросите сброс снова
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
