"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportClientCrash } from "@/lib/report-client-crash";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    reportClientCrash(error, "error");
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <p className="text-4xl" aria-hidden>
        😕
      </p>
      <h1 className="text-balance text-xl font-bold text-foreground sm:text-2xl">Не удалось загрузить страницу</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        Обновите вкладку. В Яндекс.Браузере отключите «Турбо» для сайта или откройте страницу в другом браузере.
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted-foreground">Код: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          className="min-h-11 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          onClick={() => reset()}
        >
          Повторить
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted/60"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
