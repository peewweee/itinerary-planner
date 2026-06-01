"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CrowdResult, Spot } from "@/types";
import { BAND_META } from "@/lib/ui";
import { CrowdScoreInfo } from "./CrowdBadge";

export interface MapMarker {
  spot: Spot;
  crowd: CrowdResult;
  order: number;
}

// A numbered, crowd-colored pin built with divIcon — avoids the broken
// default-marker-image problem that Leaflet has under bundlers.
function pinIcon(order: number, hex: string): L.DivIcon {
  return L.divIcon({
    className: "crowdflow-pin",
    html: `<div style="
        background:${hex};
        width:28px;height:28px;border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,.4);
        display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:white;font-weight:700;font-size:12px;">${order}</span>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      const m = markers[0];
      map.setView([m.spot.lat, m.spot.lng], 14);
      return;
    }
    const bounds = L.latLngBounds(
      markers.map((m) => [m.spot.lat, m.spot.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, markers]);
  return null;
}

export default function MapView({ markers }: { markers: MapMarker[] }) {
  const center: [number, number] = markers.length
    ? [markers[0].spot.lat, markers[0].spot.lng]
    : [14.5896, 120.9747]; // default: Manila

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
      style={{ minHeight: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker
          key={m.spot.id}
          position={[m.spot.lat, m.spot.lng]}
          icon={pinIcon(m.order, BAND_META[m.crowd.band].hex)}
        >
          <Popup>
            <div className="text-sm">
              <strong>
                {m.order}. {m.spot.name}
              </strong>
              <br />
              <span className="inline-flex items-center gap-1.5">
                {BAND_META[m.crowd.band].label} · {m.crowd.score}/100
                <CrowdScoreInfo />
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
      <FitBounds markers={markers} />
    </MapContainer>
  );
}
