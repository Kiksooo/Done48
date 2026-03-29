import type { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dashboardPath, isAppRole, type AppRole } from "@/lib/routes";

export function prismaRoleToApp(role: Role): AppRole {
  return role as AppRole;
}

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
  onboardingDone: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAppRole(session.user.role)) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: session.user.role,
    onboardingDone: session.user.onboardingDone,
  };
}

/**
 * Для server actions: JWT + фактически активная учётная запись в БД (isActive).
 */
export async function getSessionUserForAction(): Promise<SessionUser | null> {
  const base = await getSessionUser();
  if (!base) return null;
  const row = await prisma.user.findUnique({
    where: { id: base.id },
    select: { isActive: true },
  });
  if (!row?.isActive) return null;
  return base;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function requireRole(user: { role: AppRole }, allowed: Role | Role[]) {
  const list = Array.isArray(allowed) ? allowed : [allowed];
  if (!list.includes(user.role as Role)) {
    throw new Error("Forbidden");
  }
}

export function redirectPathForUser(user: {
  role: AppRole;
  onboardingDone: boolean;
}): string {
  return dashboardPath(user.role, user.onboardingDone);
}
