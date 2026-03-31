"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type AddressGeocodeHit = {
  displayName: string;
  lat: number;
  lng: number;
};

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  onPick?: (hit: AddressGeocodeHit) => void;
  minChars?: number;
  suggestDebounceMs?: number;
};

export const AddressAutocompleteInput = forwardRef<HTMLInputElement, Props>(function AddressAutocompleteInput(
  { value, onChange, onPick, minChars = 2, suggestDebounceMs = 320, className, ...inputProps },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddressGeocodeHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(0);
  const justPickedRef = useRef(false);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      setItems([]);
      setOpen(false);
      return;
    }

    const q = value.trim();
    if (q.length < minChars) {
      setItems([]);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      const mySeq = ++seqRef.current;
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(q)}&limit=8`);
        if (seqRef.current !== mySeq) return;
        if (!res.ok) {
          setItems([]);
          setOpen(false);
          return;
        }
        const data = (await res.json()) as { results: AddressGeocodeHit[] };
        const next = data.results ?? [];
        setItems(next);
        setOpen(next.length > 0);
        setActiveIndex(0);
      } finally {
        if (seqRef.current === mySeq) setLoading(false);
      }
    }, suggestDebounceMs);

    return () => window.clearTimeout(timer);
  }, [value, minChars, suggestDebounceMs]);

  const pick = useCallback(
    (hit: AddressGeocodeHit) => {
      justPickedRef.current = true;
      onChange(hit.displayName);
      onPick?.(hit);
      setOpen(false);
      setItems([]);
    },
    [onChange, onPick],
  );

  return (
    <div ref={containerRef} className="relative">
      <Input
        {...inputProps}
        ref={ref}
        className={cn(className)}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          inputProps.onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (!open || items.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(items[activeIndex] ?? items[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {loading ? <p className="mt-1 text-xs text-muted-foreground">Подсказки…</p> : null}
      {open && items.length > 0 ? (
        <ul
          className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-card py-1 text-card-foreground shadow-elevated"
          role="listbox"
        >
          {items.map((hit, i) => (
            <li key={`${hit.lat}-${hit.lng}-${i}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted",
                  i === activeIndex && "bg-muted",
                )}
                onMouseDown={(ev) => ev.preventDefault()}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => pick(hit)}
              >
                {hit.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

AddressAutocompleteInput.displayName = "AddressAutocompleteInput";
