import { prisma } from "@/lib/db";
import { ensurePlatformSettingsTable } from "@/server/db/ensure-platform-settings";

export async function getPlatformSettings() {
  try {
    return await prisma.platformSettings.findUnique({ where: { id: "default" } });
  } catch {
    try {
      await ensurePlatformSettingsTable();
      return await prisma.platformSettings.findUnique({ where: { id: "default" } });
    } catch {
      return null;
    }
  }
}
