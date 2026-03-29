"use client";

import { useEffect, useId, useRef, useState } from "react";
import { searchRussianCities } from "@/lib/city-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
};

export function RussianCityInput({ id, label, value, onChange, disabled, hint }: Props) {
  const genId = useId();
  const inputId = id ?? `city-${genId}`;
  const listId = `${inputId}-suggestions`;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const suggestions = open && value.trim().length > 0 ? searchRussianCities(value, 20) : [];

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [value]);

  function pick(city: string) {
    onChange(city);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      {hint ? <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p> : null}
      <Input
        id={inputId}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        disabled={disabled}
        placeholder="Начните вводить или выберите из списка"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(suggestions[highlight]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="max-h-60 overflow-auto rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-md dark:border-neutral-700 dark:bg-neutral-950"
        >
          {suggestions.map((c, i) => (
            <li key={c} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={cn(
                  "flex w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900",
                  i === highlight && "bg-neutral-100 dark:bg-neutral-900",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(c)}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
