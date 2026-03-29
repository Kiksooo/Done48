import L from "leaflet";

let fixed: boolean | undefined;

/** Leaflet в бандлере теряет пути к иконке маркера — подставляем CDN один раз. */
export function ensureLeafletDefaultIcons() {
  if (typeof window === "undefined" || fixed) return;
  fixed = true;
  const Icon = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
  delete Icon._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}
