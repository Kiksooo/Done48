"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { ensureLeafletDefaultIcons } from "./leaflet-icons";
import "leaflet/dist/leaflet.css";

function MapClickSelect({
  onSelect,
  disabled,
}: {
  onSelect: (lat: number, lng: number) => void;
  disabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!disabled) onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function WorkLocationPicker(props: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  const { lat, lng, onChange, disabled } = props;

  useEffect(() => {
    ensureLeafletDefaultIcons();
  }, []);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          style={{ height: 280, width: "100%" }}
          scrollWheelZoom={!disabled}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter lat={lat} lng={lng} />
          <MapClickSelect onSelect={onChange} disabled={Boolean(disabled)} />
          <Marker
            position={[lat, lng]}
            draggable={!disabled}
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                onChange(p.lat, p.lng);
              },
            }}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-neutral-500">
        Кликните по карте или перетащите метку, чтобы указать место встречи или выполнения работ.
      </p>
    </div>
  );
}

