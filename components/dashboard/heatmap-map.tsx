"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ClusterRisk, HeatCluster, HeatPoint } from "@/lib/heatmap";

export type { ClusterRisk, HeatCluster, HeatPoint };

const RISK_COLOR: Record<ClusterRisk, string> = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#2dd4bf",
};

const HEAT_GRADIENT = {
  0.2: "#2dd4bf",
  0.45: "#f59e0b",
  0.7: "#ef4444",
  1.0: "#991b1b",
};

/** Public OSM raster tiles — no API key, no map-provider bill. */
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface HeatmapMapProps {
  clusters: HeatCluster[];
  points?: HeatPoint[];
  selectedId: string | null;
  showHeat: boolean;
  showMarkers: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
  fitKey?: string;
}

export function HeatmapMap({
  clusters,
  points = [],
  selectedId,
  showHeat,
  showMarkers,
  onSelect,
  compact = false,
  fitKey,
}: HeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const onSelectRef = useRef(onSelect);
  const lastFitKeyRef = useRef<string>("");
  onSelectRef.current = onSelect;

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let observer: ResizeObserver | null = null;

    async function setup() {
      (window as unknown as { L: typeof L }).L = L;
      await import("leaflet.heat");
      if (cancelled || !el || mapRef.current) return;

      const map = L.map(el, {
        center: [7.8731, 80.7718],
        zoom: compact ? 7 : 8,
        minZoom: 7,
        maxZoom: 16,
        zoomControl: !compact,
        scrollWheelZoom: !compact,
        attributionControl: true,
      });

      L.tileLayer(OSM_TILES, {
        attribution: OSM_ATTR,
        maxZoom: 19,
      }).addTo(map);

      map.setMaxBounds(L.latLngBounds([5.7, 79.4], [10.1, 82.2]));
      if (window.matchMedia("(max-width: 767px)").matches) {
        map.scrollWheelZoom.disable();
      }
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(el);
      requestAnimationFrame(() => map.invalidateSize());
      setReady(true);
    }

    void setup();

    return () => {
      cancelled = true;
      observer?.disconnect();
      heatLayerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      heatLayerRef.current = null;
      setReady(false);
    };
  }, [compact]);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!ready || !map || !group) return;

    const latlngs: L.HeatLatLngTuple[] = (
      points.length > 0
        ? points
        : clusters.map((c) => ({
            lat: c.lat,
            lng: c.lng,
            intensity:
              c.risk === "High" ? 0.9 : c.risk === "Medium" ? 0.55 : 0.3,
          }))
    ).map((p) => [p.lat, p.lng, p.intensity]);

    if (showHeat && latlngs.length > 0) {
      if (heatLayerRef.current) {
        heatLayerRef.current.setLatLngs(latlngs);
      } else {
        heatLayerRef.current = L.heatLayer(latlngs, {
          radius: compact ? 22 : 28,
          blur: compact ? 16 : 22,
          maxZoom: 14,
          minOpacity: 0.35,
          gradient: HEAT_GRADIENT,
        }).addTo(map);
      }
    } else if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }

    group.clearLayers();

    if (showMarkers) {
      clusters.forEach((c) => {
        const color = RISK_COLOR[c.risk];
        const selected = c.id === selectedId;
        const marker = L.circleMarker([c.lat, c.lng], {
          radius: selected ? 11 : compact ? 5 : 7,
          color,
          weight: selected ? 3 : 2,
          fillColor: color,
          fillOpacity: 0.95,
          className: c.risk === "High" ? "ds-pulse-marker" : undefined,
        });
        marker.on("click", () => onSelectRef.current(c.id));
        marker.bindTooltip(`${c.name}, ${c.reports} reports`, {
          direction: "top",
          opacity: 0.95,
        });
        marker.addTo(group);
      });
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [ready, clusters, points, selectedId, showHeat, showMarkers, compact]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || compact || clusters.length === 0) return;
    const key = fitKey ?? "default";
    if (key === lastFitKeyRef.current) return;
    lastFitKeyRef.current = key;
    const bounds = L.latLngBounds(clusters.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds.pad(0.35), { maxZoom: 11, animate: true });
  }, [ready, clusters, compact, fitKey]);

  return <div ref={containerRef} className="h-full w-full" />;
}
