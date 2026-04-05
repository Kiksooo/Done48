"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Не удалось загрузить страницу</h1>
      <p className="max-w-md text-sm text-neutral-600 dark:text-neutral-400">
        Попробуйте обновить вкладку. В браузере Яндекса иногда мешает режим «Турбо» или расширения — откройте сайт без Турбо или в другом браузере.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-neutral-500">Код: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          onClick={() => reset()}
        >
          Повторить
        </button>
        <Link
          href="/"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-900"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
