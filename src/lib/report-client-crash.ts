"use client";

type CrashSource = "global-error" | "error";

/**
 * Отправляет краткий отчёт на сервер (console.error в логах Vercel/хостинга).
 * В dev не вызывается, чтобы не засорять логи.
 */
export function reportClientCrash(
  error: Error & { digest?: string },
  source: CrashSource,
): void {
  if (process.env.NODE_ENV !== "production") return;
  if (typeof window === "undefined") return;

  const body = {
    source,
    digest: error.digest,
    name: error.name,
    message: error.message?.slice(0, 500) ?? "",
    href: window.location.href.slice(0, 500),
    ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : undefined,
  };

  void fetch("/api/telemetry/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}
