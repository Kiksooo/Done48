import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dashboardPath, isAppRole, roleMatchesCabinet } from "@/lib/routes";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/legal",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // Публичное портфолио специалиста: /u/username
  if (pathname.startsWith("/u/") && pathname.length > 3) {
    return true;
  }
  // Каталог специалистов и превью галереи — без входа
  if (pathname === "/executors" || pathname.startsWith("/executors/")) {
    return true;
  }
  // Блог — публичные страницы
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /** За прокси (Vercel, nginx) http → https, чтобы канонический доступ был по TLS. */
  if (request.headers.get("x-forwarded-proto") === "http") {
    const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
    if (host && host !== "localhost" && host !== "127.0.0.1" && !host.endsWith(".local")) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      return NextResponse.redirect(url, 308);
    }
  }

  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/upload/")) {
    return NextResponse.next();
  }

  let token: Awaited<ReturnType<typeof getToken>> | null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch (e) {
    // Без этого при сбое JWT (секрет, обновление next-auth) ответ мог обрываться — «пустая» вкладка.
    console.error("[middleware] getToken failed", e);
    token = null;
  }

  if (pathname === "/") {
    if (!token) {
      return NextResponse.next();
    }
    const role = token.role;
    const onboardingDone = Boolean(token.onboardingDone);
    if (!isAppRole(role)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(
      new URL(dashboardPath(role, onboardingDone), request.url),
    );
  }

  if (isPublicPath(pathname)) {
    // Публичные страницы галереи / каталога — всем, в т. ч. авторизованным (без редиректа в кабинет)
    if (
      pathname.startsWith("/u/") ||
      pathname === "/executors" ||
      pathname.startsWith("/executors/")
    ) {
      return NextResponse.next();
    }
    if (token && isAppRole(token.role)) {
      const onboardingDone = Boolean(token.onboardingDone);
      return NextResponse.redirect(
        new URL(dashboardPath(token.role, onboardingDone), request.url),
      );
    }
    return NextResponse.next();
  }

  if (!token || !isAppRole(token.role)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = token.role;
  const onboardingDone = Boolean(token.onboardingDone);

  if (!onboardingDone && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (onboardingDone && pathname === "/onboarding") {
    return NextResponse.redirect(new URL(dashboardPath(role, true), request.url));
  }

  /**
   * Кабинеты заказчика и специалиста: пускаем любого вошедшего с завершённым онбордингом.
   * Точная роль берётся из БД в layout — так после смены роли админом не ловим «ложный» /login.
   * Админ-префикс по-прежнему только при role === ADMIN в JWT.
   */
  if (pathname.startsWith("/customer") || pathname.startsWith("/executor")) {
    return NextResponse.next();
  }

  if (!roleMatchesCabinet(role, pathname)) {
    return NextResponse.redirect(new URL(dashboardPath(role, onboardingDone), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
