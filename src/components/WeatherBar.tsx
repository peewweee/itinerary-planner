import { Weather } from "@/types";

const WEATHER_META: Record<
  Weather["condition"],
  { emoji: string; label: string; effect: string }
> = {
  clear: {
    emoji: "☀️",
    label: "Clear",
    effect: "Outdoor spots draw bigger crowds.",
  },
  clouds: {
    emoji: "⛅",
    label: "Cloudy",
    effect: "Crowds spread evenly.",
  },
  rain: {
    emoji: "🌧️",
    label: "Rainy",
    effect: "Crowds shift from outdoor sites into malls.",
  },
  storm: {
    emoji: "⛈️",
    label: "Stormy",
    effect: "Outdoor sites empty out; indoor venues fill up.",
  },
};

export function WeatherBar({ weather }: { weather: Weather }) {
  const meta = WEATHER_META[weather.condition];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <span className="text-2xl leading-none">{meta.emoji}</span>
      <div>
        <div className="font-medium text-slate-800">
          {meta.label} · {weather.tempC}°C
        </div>
        <div className="text-slate-500">{meta.effect}</div>
      </div>
    </div>
  );
}
