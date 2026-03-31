"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapInvalidateSize } from "./map-invalidate-size";
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

function MapRecenter({ lat, lng, locatePulse }: { lat: number; lng: number; locatePulse: number }) {
  const map = useMap();
  const prevPulse = useRef(locatePulse);
  useEffect(() => {
    if (prevPulse.current === locatePulse) return;
    prevPulse.current = locatePulse;
    const z = Math.max(map.getZoom(), 15);
    map.flyTo([lat, lng], z, { duration: 0.45 });
  }, [lat, lng, locatePulse, map]);
  return null;
}

export function WorkLocationPicker(props: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  /** Увеличивайте после выбора адреса / автогеокода — карта плавно подъедет; клик и метка без пульса не трогают вид. */
  locatePulse?: number;
  disabled?: boolean;
}) {
  const { lat, lng, onChange, locatePulse = 0, disabled } = props;

  useEffect(() => {
    ensureLeafletDefaultIcons();
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative z-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 [&_.leaflet-container]:z-0">
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
          <MapInvalidateSize />
          <MapRecenter lat={lat} lng={lng} locatePulse={locatePulse} />
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

