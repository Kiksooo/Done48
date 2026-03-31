import { prisma } from "@/lib/db";

export async function getPlatformSettings() {
  try {
    return await prisma.platformSettings.findUnique({ where: { id: "default" } });
  } catch {
    return null;
  }
}
