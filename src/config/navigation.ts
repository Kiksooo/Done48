/**
 * Навигация кабинетов (сериализуемые данные).
 * `end: true` — только точное совпадение пути (дашборд у корня кабинета).
 */

export type NavIconName =
  | "layoutDashboard"
  | "users"
  | "clipboardList"
  | "folderTree"
  | "inbox"
  | "scale"
  | "creditCard"
  | "banknote"
  | "bell"
  | "settings"
  | "scrollText"
  | "plusCircle"
  | "messageSquare"
  | "wallet"
  | "user"
  | "briefcase"
  | "search"
  | "flag"
  | "mail"
  | "penLine";

export type CabinetNavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  /** Только exact match (например `/admin`, `/customer`) */
  end?: boolean;
};

export const ADMIN_NAV: CabinetNavItem[] = [
  { href: "/admin", label: "Дашборд", icon: "layoutDashboard", end: true },
  { href: "/admin/users", label: "Пользователи", icon: "users" },
  { href: "/admin/executors", label: "Специалисты", icon: "briefcase" },
  { href: "/admin/orders", label: "Заказы", icon: "clipboardList" },
  { href: "/admin/categories", label: "Категории", icon: "folderTree" },
  { href: "/admin/proposals", label: "Отклики", icon: "inbox" },
  { href: "/admin/disputes", label: "Споры", icon: "scale" },
  { href: "/admin/moderation", label: "Модерация", icon: "flag" },
  { href: "/admin/payments", label: "Платежи", icon: "creditCard" },
  { href: "/admin/payouts", label: "Выплаты", icon: "banknote" },
  { href: "/admin/notifications", label: "Уведомления", icon: "bell" },
  { href: "/admin/marketing", label: "Рассылки", icon: "mail" },
  { href: "/admin/support", label: "Чат поддержки", icon: "mail" },
  { href: "/admin/settings", label: "Настройки", icon: "settings" },
  { href: "/admin/blog", label: "Блог", icon: "penLine" },
  { href: "/admin/audit-logs", label: "Логи", icon: "scrollText" },
];

export const CUSTOMER_NAV: CabinetNavItem[] = [
  { href: "/customer", label: "Дашборд", icon: "layoutDashboard", end: true },
  { href: "/customer/orders", label: "Мои заказы", icon: "clipboardList" },
  { href: "/customer/orders/new", label: "Создать заказ", icon: "plusCircle" },
  { href: "/customer/messages", label: "Сообщения", icon: "messageSquare" },
  { href: "/customer/balance", label: "Баланс", icon: "wallet" },
  { href: "/customer/profile", label: "Профиль", icon: "user" },
  { href: "/customer/feedback", label: "Чат с админом", icon: "mail" },
  { href: "/customer/notifications", label: "Уведомления", icon: "bell" },
];

export const EXECUTOR_NAV: CabinetNavItem[] = [
  { href: "/executor", label: "Дашборд", icon: "layoutDashboard", end: true },
  { href: "/executor/orders", label: "Мои заказы", icon: "briefcase" },
  { href: "/executor/orders/available", label: "Доступные заказы", icon: "search" },
  { href: "/executor/profile", label: "Профиль", icon: "user" },
  { href: "/executor/portfolio", label: "Галерея работ", icon: "folderTree" },
  { href: "/executor/balance", label: "Баланс и выплаты", icon: "banknote" },
  { href: "/executor/messages", label: "Сообщения", icon: "messageSquare" },
  { href: "/executor/feedback", label: "Чат с админом", icon: "mail" },
  { href: "/executor/notifications", label: "Уведомления", icon: "bell" },
];

function matchesItem(pathname: string, item: CabinetNavItem): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = item.href.replace(/\/$/, "") || "/";
  if (item.end) {
    return p === h;
  }
  return p === h || p.startsWith(`${h}/`);
}

/** Один «активный» пункт — самый длинный совпадающий href (важно для /orders vs /orders/new). */
export function getActiveNavHref(
  pathname: string,
  items: readonly CabinetNavItem[],
): string | null {
  const matches = items.filter((item) => matchesItem(pathname, item));
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => (a.href.length >= b.href.length ? a : b)).href;
}

export function isNavActive(pathname: string, item: CabinetNavItem, items: readonly CabinetNavItem[]): boolean {
  const activeHref = getActiveNavHref(pathname, items);
  return activeHref !== null && item.href === activeHref;
}
