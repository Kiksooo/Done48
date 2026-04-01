import { prisma } from "@/lib/db";

const USER_THREAD_TITLES = ["Вы написали в поддержку", "Ответ поддержки"] as const;

export type SupportMessage = {
  id: string;
  author: "user" | "admin";
  text: string;
  createdAt: Date;
};

export async function listSupportMessagesForUser(userId: string): Promise<SupportMessage[]> {
  const rows = await prisma.notification.findMany({
    where: { userId, title: { in: [...USER_THREAD_TITLES] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, body: true, createdAt: true },
  });
  return rows.map((r) => ({
    id: r.id,
    author: r.title === "Ответ поддержки" ? "admin" : "user",
    text: r.body ?? "",
    createdAt: r.createdAt,
  }));
}

export type SupportAdminDialog = {
  userId: string;
  userEmail: string;
  lastMessage: string;
  lastAt: Date;
};

function userIdFromAdminLink(link: string | null): string | null {
  if (!link) return null;
  try {
    const u = new URL(link, "https://local.done48");
    return u.pathname === "/admin/support" ? u.searchParams.get("userId") : null;
  } catch {
    return null;
  }
}

export async function listSupportDialogsForAdmin(): Promise<SupportAdminDialog[]> {
  const rows = await prisma.notification.findMany({
    where: { title: "Чат поддержки: новое сообщение" },
    orderBy: { createdAt: "desc" },
    select: { link: true, body: true, createdAt: true },
    take: 400,
  });

  const latestByUser = new Map<string, { body: string | null; createdAt: Date }>();
  for (const row of rows) {
    const userId = userIdFromAdminLink(row.link);
    if (!userId || latestByUser.has(userId)) continue;
    latestByUser.set(userId, { body: row.body, createdAt: row.createdAt });
  }

  const userIds = Array.from(latestByUser.keys());
  if (userIds.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  const result: SupportAdminDialog[] = userIds.map((userId) => {
    const latest = latestByUser.get(userId)!;
    const raw = latest.body ?? "";
    const lastMessage = raw.includes("Сообщение:")
      ? raw.split("Сообщение:").slice(1).join("Сообщение:").trim()
      : raw.trim();
    return {
      userId,
      userEmail: emailById.get(userId) ?? "unknown",
      lastMessage: lastMessage.slice(0, 180),
      lastAt: latest.createdAt,
    };
  });

  result.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
  return result;
}
