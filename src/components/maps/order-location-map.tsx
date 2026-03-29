"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { ensureLeafletDefaultIcons } from "./leaflet-icons";
import "leaflet/dist/leaflet.css";

export function OrderLocationMap(props: {
  lat: number;
  lng: number;
  heightPx?: number;
}) {
  const { lat, lng, heightPx = 240 } = props;

  useEffect(() => {
    ensureLeafletDefaultIcons();
  }, []);

  const yandexMapsUrl = `https://yandex.ru/maps/?pt=${encodeURIComponent(`${lng},${lat}`)}&z=16&l=map`;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          style={{ height: heightPx, width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} />
        </MapContainer>
      </div>
      <p className="text-xs">
        <a
          href={yandexMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Открыть в Яндекс.Картах
        </a>
        <span className="text-neutral-500"> — маршрут и точка на местности</span>
      </p>
    </div>
  );
}
