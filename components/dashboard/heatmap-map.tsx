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
  maxFitZoom?: number;
}

function clusterIcon(
  cluster: HeatCluster,
  selected: boolean,
  compact: boolean,
): L.DivIcon {
  const color = RISK_COLOR[cluster.risk];
  const size = compact ? (selected ? 32 : 24) : selected ? 44 : 36;
  const label = cluster.id;
  return L.divIcon({
    className: "ds-cluster-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="ds-cluster-pin${selected ? " is-selected" : ""}${
      !selected && cluster.risk === "High" ? " is-high" : ""
    }" style="--ds-color:${color}">${label}</div>`,
  });
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
  maxFitZoom = 11,
}: HeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const onSelectRef = useRef(onSelect);
  const clustersRef = useRef(clusters);
  const compactRef = useRef(compact);
  const lastFitKeyRef = useRef<string>("");
  const lastSelectedRef = useRef<string | null>(null);
  onSelectRef.current = onSelect;
  clustersRef.current = clusters;
  compactRef.current = compact;

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
    if (!ready || !map) return;

    const onClick = (event: L.LeafletMouseEvent) => {
      const list = clustersRef.current;
      if (list.length === 0) return;
      const hitPx = compactRef.current ? 36 : 80;
      let bestId: string | null = null;
      let bestPx = Infinity;
      for (const cluster of list) {
        const point = map.latLngToContainerPoint(
          L.latLng(cluster.lat, cluster.lng),
        );
        const distance = point.distanceTo(event.containerPoint);
        if (distance < bestPx) {
          bestPx = distance;
          bestId = cluster.id;
        }
      }
      if (bestId && bestPx <= hitPx) {
        onSelectRef.current(bestId);
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [ready]);

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
      const canvas = (
        heatLayerRef.current as L.HeatLayer & { _canvas?: HTMLCanvasElement }
      )._canvas;
      if (canvas) canvas.style.pointerEvents = "none";
    } else if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }

    group.clearLayers();

    if (showMarkers) {
      clusters.forEach((c) => {
        const selected = c.id === selectedId;
        const marker = L.marker([c.lat, c.lng], {
          icon: clusterIcon(c, selected, compact),
          keyboard: true,
          riseOnHover: true,
          zIndexOffset: selected ? 1000 : 0,
          title: `${c.id} · ${c.reports} reports`,
        });
        marker.on("click", () => onSelectRef.current(c.id));
        marker.bindTooltip(`${c.id} · ${c.name} · ${c.reports} reports`, {
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
    map.fitBounds(bounds.pad(0.35), { maxZoom: maxFitZoom, animate: true });
  }, [ready, clusters, compact, fitKey, maxFitZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || compact || !selectedId) return;
    const cluster = clusters.find((c) => c.id === selectedId);
    if (!cluster) return;
    if (lastSelectedRef.current === selectedId) return;
    const isInitial = lastSelectedRef.current === null;
    lastSelectedRef.current = selectedId;
    if (isInitial) return;
    map.panTo([cluster.lat, cluster.lng], { animate: true });
  }, [ready, selectedId, clusters, compact]);

  return <div ref={containerRef} className="h-full w-full" />;
}
