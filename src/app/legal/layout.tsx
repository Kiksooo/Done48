import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Юридическая информация — DONE48",
  description: "Политика конфиденциальности и пользовательское соглашение сервиса DONE48.",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-foreground">
            DONE48
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Вход
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
