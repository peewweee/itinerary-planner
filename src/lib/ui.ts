import { CrowdBand } from "@/types";

// Shared visual mapping for crowd bands, used by badges and map markers.
export const BAND_META: Record<
  CrowdBand,
  { label: string; hex: string; chip: string; dot: string }
> = {
  low: {
    label: "Not crowded",
    hex: "#16a34a",
    chip: "bg-green-100 text-green-800 border-green-200",
    dot: "bg-green-500",
  },
  medium: {
    label: "Filling up",
    hex: "#d97706",
    chip: "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  high: {
    label: "Packed",
    hex: "#dc2626",
    chip: "bg-red-100 text-red-800 border-red-200",
    dot: "bg-red-500",
  },
};

export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}
