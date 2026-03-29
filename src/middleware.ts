import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dashboardPath, isAppRole, roleMatchesCabinet } from "@/lib/routes";

const PUBLIC_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // Публичное портфолио исполнителя: /u/username
  if (pathname.startsWith("/u/") && pathname.length > 3) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

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
    // Публичное портфолио доступно всем, в том числе авторизованным
    if (pathname.startsWith("/u/")) {
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
