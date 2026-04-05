"use client";

import { useEffect } from "react";
import { reportClientCrash } from "@/lib/report-client-crash";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportClientCrash(error, "global-error");
  }, [error]);

  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-4 text-center text-neutral-100">
        <h1 className="text-xl font-semibold">Критическая ошибка</h1>
        <p className="max-w-md text-sm text-neutral-400">
          Обновите страницу или откройте done48.ru в обычном окне без режима Турбо. Если не помогает — напишите в поддержку.
        </p>
        {error.digest ? <p className="font-mono text-xs text-neutral-600">Код: {error.digest}</p> : null}
        <button
          type="button"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          onClick={() => reset()}
        >
          Повторить
        </button>
      </body>
    </html>
  );
}
