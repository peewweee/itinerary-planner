"use client";

import { useState } from "react";
import { CATEGORIES, Category } from "@/types";
import { GenerateItineraryInput } from "@/lib/dataService";
import { formatHour } from "@/lib/ui";

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM - 10 PM

export function ItineraryForm({
  cities,
  loading,
  onGenerate,
}: {
  cities: string[];
  loading: boolean;
  onGenerate: (input: GenerateItineraryInput) => void;
}) {
  const [city, setCity] = useState(cities[0] ?? "");
  const [interests, setInterests] = useState<Set<Category>>(
    new Set<Category>(["history", "food"])
  );
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);

  const toggle = (cat: Category) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const valid = interests.size > 0 && endHour > startHour && city;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onGenerate({
          city,
          interests: Array.from(interests),
          startHour,
          endHour,
        });
      }}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Where to?
        </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
        >
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          What are you into?
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = interests.has(cat.key);
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => toggle(cat.key)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                <span className="mr-1">{cat.emoji}</span>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Start
          </label>
          <select
            value={startHour}
            onChange={(e) => setStartHour(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            End
          </label>
          <select
            value={endHour}
            onChange={(e) => setEndHour(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={!valid || loading}
        className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Planning your day…" : "Plan my day"}
      </button>
      {!valid && (
        <p className="text-center text-xs text-slate-400">
          Pick at least one interest and a valid time range.
        </p>
      )}
    </form>
  );
}
