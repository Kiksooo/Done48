import Link from "next/link";

export function AuthLegalLinks() {
  return (
    <footer
      className="mt-10 w-full max-w-md border-t border-border/60 pt-6 text-center text-xs text-muted-foreground"
      aria-label="Юридическая информация"
    >
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/legal" className="underline-offset-4 hover:text-foreground hover:underline">
          Юридическая информация
        </Link>
        <Link href="/legal/terms" className="underline-offset-4 hover:text-foreground hover:underline">
          Соглашение
        </Link>
        <Link href="/legal/fees" className="underline-offset-4 hover:text-foreground hover:underline">
          Комиссии
        </Link>
        <Link href="/legal/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
          Персональные данные
        </Link>
      </nav>
    </footer>
  );
}
