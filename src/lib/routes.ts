/**
 * Маршруты и редиректы без зависимости от Prisma (удобно для Edge middleware).
 */

export type AppRole = "ADMIN" | "EXECUTOR" | "CUSTOMER";

export function isAppRole(value: unknown): value is AppRole {
  return value === "ADMIN" || value === "EXECUTOR" || value === "CUSTOMER";
}

export function dashboardPath(role: AppRole | string, onboardingDone: boolean): string {
  if (!onboardingDone) return "/onboarding";
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "CUSTOMER":
      return "/customer";
    case "EXECUTOR":
      return "/executor";
    default:
      return "/login";
  }
}

/** Проверка: может ли роль заходить в префикс кабинета. */
export function roleMatchesCabinet(role: AppRole | string, pathname: string): boolean {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/customer")) return role === "CUSTOMER";
  if (pathname.startsWith("/executor")) return role === "EXECUTOR";
  /** Остальные пути (в т.ч. `/orders/*`) — доступ уточняется в RSC / actions. */
  return true;
}
