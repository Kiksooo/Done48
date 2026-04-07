import raw from "@/data/russian-cities.json";

export const RUSSIAN_CITY_NAMES = raw as readonly string[];

/** Подсказки по справочнику городов РФ (актуализированный полный список). */
export function searchRussianCities(query: string, limit = 20): string[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const starts: string[] = [];
  const includes: string[] = [];

  for (const c of RUSSIAN_CITY_NAMES) {
    const cl = c.toLowerCase();
    if (cl.startsWith(q)) starts.push(c);
    else if (cl.includes(q)) includes.push(c);
  }

  starts.sort((a, b) => a.localeCompare(b, "ru"));
  includes.sort((a, b) => a.localeCompare(b, "ru"));

  return [...starts, ...includes].slice(0, limit);
}
