import Link from "next/link";
import type { ReactNode } from "react";
import type { CabinetNavItem } from "@/config/navigation";
import { CabinetChrome } from "@/components/layout/cabinet-chrome";

type CabinetShellProps = {
  brand: string;
  nav: CabinetNavItem[];
  userEmail: string;
  /** Непрочитанные in-app уведомления (бейдж у пункта «Уведомления»). */
  unreadNotifications?: number;
  /** Непрочитанные сообщения в чатах по заказам (бейдж у «Сообщения»). */
  unreadChatMessages?: number;
  /** Ссылка «Профиль» в подвале боковой панели. */
  profileHref?: string;
  /** Ссылка на помощь / юридические документы. */
  helpHref?: string;
  /** Подсказка завершить онбординг (над контентом страницы). */
  showOnboardingCallout?: boolean;
  children: ReactNode;
};

export function CabinetShell({
  brand,
  nav,
  userEmail,
  unreadNotifications = 0,
  unreadChatMessages = 0,
  profileHref,
  helpHref = "/legal",
  showOnboardingCallout = false,
  children,
}: CabinetShellProps) {
  return (
    <CabinetChrome
      brand={brand}
      nav={nav}
      userEmail={userEmail}
      unreadNotifications={unreadNotifications}
      unreadChatMessages={unreadChatMessages}
      profileHref={profileHref}
      helpHref={helpHref}
    >
      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div
          className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-slate-400/[0.06] blur-3xl dark:bg-slate-500/[0.07]"
          aria-hidden
        />
        <div className="relative">
        {showOnboardingCallout ? (
          <div className="mb-6 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
              Остался один шаг: коротко познакомьтесь с платформой
            </p>
            <p className="mt-1 text-xs text-amber-900/85 dark:text-amber-200/85">
              Так проще находить заказы или публиковать задачи без лишних вопросов.
            </p>
            <Link
              href="/onboarding"
              className="mt-2 inline-flex text-sm font-semibold text-primary underline underline-offset-2"
            >
              Продолжить знакомство →
            </Link>
          </div>
        ) : null}
        {children}
        </div>
      </div>
    </CabinetChrome>
  );
}
