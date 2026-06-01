"use client";

import { useEffect, useState } from "react";

// Branded intro overlay. Shows on first load, then fades out and unmounts
// itself via the onDone callback.
export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), 1800);
    const done = setTimeout(onDone, 2400);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-sky-500 via-sky-600 to-indigo-700 transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center">
        <div className="animate-splash-pop flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 text-6xl shadow-2xl ring-1 ring-white/30 backdrop-blur-sm">
          <span className="animate-compass-spin">🧭</span>
        </div>

        <h1 className="animate-splash-rise mt-6 text-4xl font-extrabold tracking-tight text-white">
          CrowdFlow
        </h1>
        <p className="animate-splash-rise mt-2 text-sm font-medium text-sky-100 [animation-delay:120ms]">
          Skip the crowds. Enjoy the Philippines.
        </p>
      </div>

      <div className="animate-splash-rise absolute bottom-12 flex items-center gap-2 text-xs text-sky-100/80 [animation-delay:240ms]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-100" />
        Loading your map…
      </div>
    </div>
  );
}
