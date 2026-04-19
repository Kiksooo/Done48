import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicUploadMode } from "@/lib/uploads/public-file-upload";

export const dynamic = "force-dynamic";

/** Публичная проверка живости и связи с БД (uptime, алерты). */
export async function GET() {
  const uploads = {
    mode: getPublicUploadMode(),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: true,
      uploads,
      ts: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, db: false, uploads, ts: new Date().toISOString() },
      { status: 503 },
    );
  }
}
