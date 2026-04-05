import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  source: z.enum(["global-error", "error"]),
  digest: z.string().max(80).optional(),
  name: z.string().max(120).optional(),
  message: z.string().max(500).optional(),
  href: z.string().max(500).optional(),
  ua: z.string().max(400).optional(),
});

/**
 * Принимает отчёт с клиентских error boundary. Ищите в логах строку [telemetry/client-error].
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.error(
    "[telemetry/client-error]",
    JSON.stringify({ ...parsed.data, ts: new Date().toISOString() }),
  );

  return NextResponse.json({ ok: true });
}
