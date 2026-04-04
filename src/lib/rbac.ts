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

type ResolvedRow = {
  id: string;
  email: string;
  role: Role;
  onboardingDone: boolean;
  isActive: boolean;
};

/**
 * Роль и онбординг из БД (в т.ч. после смены роли админом). JWT в middleware может отставать —
 * layout’ы и server actions опираются на эти данные.
 */
async function resolveSessionUserRow(): Promise<ResolvedRow | null> {
  try {
    const session = await getServerSession(authOptions);
    const id = session?.user?.id;
    if (!id) return null;
    const row = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        onboardingDone: true,
        isActive: true,
      },
    });
    if (!row || !isAppRole(row.role)) return null;
    return row;
  } catch {
    return null;
  }
}

function rowToSessionUser(row: ResolvedRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    role: prismaRoleToApp(row.role),
    onboardingDone: row.onboardingDone,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const row = await resolveSessionUserRow();
  if (!row) return null;
  return rowToSessionUser(row);
}

/**
 * Для server actions и RSC: роль из БД + только активные учётки.
 */
export async function getSessionUserForAction(): Promise<SessionUser | null> {
  const row = await resolveSessionUserRow();
  if (!row?.isActive) return null;
  return rowToSessionUser(row);
}

/** Для кода, где нужен throw при отсутствии сессии или неактивном пользователе. */
export async function requireSessionUser() {
  const user = await getSessionUserForAction();
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
