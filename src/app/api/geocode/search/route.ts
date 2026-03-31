import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
};

/** Прокси к Nominatim — корректный User-Agent и без прямых запросов из браузера. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitParam = req.nextUrl.searchParams.get("limit");
  const parsed = Number(limitParam ?? "8");
  const limit = Number.isFinite(parsed) ? Math.min(10, Math.max(1, Math.floor(parsed))) : 8;

  if (q.length < 2) {
    return NextResponse.json({ results: [] as { displayName: string; lat: number; lng: number }[] });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "ru");
  url.searchParams.set("countrycodes", "ru");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          process.env.NOMINATIM_USER_AGENT ??
          "done48/0.1 (offline order address; contact: see https://www.openstreetmap.org/copyright)",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: 502 });
    }
    const rows = (await res.json()) as NominatimHit[];
    const results = rows
      .map((row) => {
        const lat = Number(row.lat);
        const lng = Number(row.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          displayName: row.display_name,
          lat,
          lng,
        };
      })
      .filter((x): x is { displayName: string; lat: number; lng: number } => x != null);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 503 });
  }
}
