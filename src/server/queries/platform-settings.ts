import { prisma } from "@/lib/db";

export async function getPlatformSettings() {
  return prisma.platformSettings.findUnique({ where: { id: "default" } });
}
