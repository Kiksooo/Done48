"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Сбой отрисовки тайлов при динамическом контейнере — после монтирования и resize. */
export function MapInvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const fix = () => {
      map.invalidateSize({ animate: false, pan: false });
    };
    fix();
    const raf = requestAnimationFrame(fix);
    const t0 = window.setTimeout(fix, 200);
    const t1 = window.setTimeout(fix, 600);
    window.addEventListener("resize", fix);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}
