import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LngLatBounds,
  Map,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../lib/maplibre";
import { systemLabel } from "../lib/systemFilter";
import type { Park, SystemFilter } from "../types";
import { useVisits } from "../hooks/useVisits";

type Props = {
  parks: Park[];
  stateCode: string;
  systemFilter?: SystemFilter;
};

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

function boundsForParks(parks: Park[]): LngLatBounds | null {
  if (parks.length === 0) return null;
  const bounds = new LngLatBounds();
  for (const park of parks) bounds.extend([park.lng, park.lat]);
  return bounds;
}

/** Bump container size by 1px so MapLibre cannot no-op resize(). */
function hardResize(map: Map, container: HTMLElement) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width < 2 || height < 2) {
    map.resize();
    return;
  }
  container.style.height = `${height + 1}px`;
  map.resize();
  container.style.height = "";
  map.resize();
}

function fitParks(map: Map, parks: Park[]) {
  const bounds = boundsForParks(parks);
  if (!bounds || bounds.isEmpty()) return;
  map.fitBounds(bounds, { padding: 48, maxZoom: 8, duration: 0 });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function ParkMap({
  parks,
  stateCode,
  systemFilter = "all",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const tooltipRef = useRef<Popup | null>(null);
  const parksRef = useRef(parks);
  const visitedRef = useRef<Set<string>>(new Set());
  const navigate = useNavigate();
  const { visits } = useVisits();
  const visitedIds = useMemo(() => new Set(visits.keys()), [visits]);
  const syncMarkersRef = useRef<() => void>(() => {});

  useEffect(() => {
    parksRef.current = parks;
    visitedRef.current = visitedIds;

    syncMarkersRef.current = () => {
      const map = mapRef.current;
      const container = containerRef.current;
      const tooltip = tooltipRef.current;
      if (!map || !container || !map.isStyleLoaded()) return;

      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];

      const currentParks = parksRef.current;
      const visited = visitedRef.current;
      const systemQs =
        systemFilter === "all" ? "" : `&system=${systemFilter}`;

      for (const park of currentParks) {
        const el = document.createElement("button");
        el.type = "button";
        const classes = ["map-marker", `map-marker--${park.system}`];
        if (visited.has(park.id)) classes.push("map-marker--visited");
        el.className = classes.join(" ");
        el.setAttribute("aria-label", park.name);
        if (park.system === "national") {
          el.innerHTML =
            '<svg class="map-marker__shield" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.1 16.4 5.2v4.8c0 3.1-2.6 5.4-6.4 6.7C6.2 15.4 3.6 13.1 3.6 10V5.2L10 3.1z"/></svg>';
        }

        el.addEventListener("click", (event) => {
          event.stopPropagation();
          tooltip?.remove();
          navigate(
            `/state/${stateCode.toLowerCase()}/park/${park.id}?view=map${systemQs}`,
          );
        });

        el.addEventListener("mouseenter", () => {
          if (!tooltip) return;
          const status = visited.has(park.id)
            ? `<div class="park-tooltip__status">Stamped</div>`
            : "";
          tooltip
            .setLngLat([park.lng, park.lat])
            .setHTML(
              `<div class="park-tooltip__inner"><strong>${escapeHtml(park.name)}</strong><div class="park-tooltip__meta">${escapeHtml(systemLabel(park.system))} · ${escapeHtml(park.locationLabel)}</div>${status}</div>`,
            )
            .addTo(map);
        });
        el.addEventListener("mouseleave", () => {
          tooltip?.remove();
        });

        markersRef.current.push(
          new Marker({ element: el, anchor: "center" })
            .setLngLat([park.lng, park.lat])
            .addTo(map),
        );
      }

      hardResize(map, container);
      fitParks(map, currentParks);
    };

    syncMarkersRef.current();
  }, [parks, visitedIds, navigate, stateCode, systemFilter]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let map: Map | null = null;

    const tooltip = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: "park-tooltip",
      maxWidth: "240px",
    });
    tooltipRef.current = tooltip;

    const start = () => {
      if (cancelled || map) return;
      if (container.clientWidth < 2 || container.clientHeight < 2) return;

      map = new Map({
        container,
        style: STYLE_URL,
        center: [-94.5, 46.0],
        zoom: 5,
        attributionControl: { compact: true },
      });
      map.addControl(
        new NavigationControl({ showCompass: false }),
        "top-right",
      );
      mapRef.current = map;

      map.on("load", () => {
        if (!map) return;
        hardResize(map, container);
        syncMarkersRef.current();
        map.once("idle", () => {
          if (!map) return;
          hardResize(map, container);
          syncMarkersRef.current();
        });
      });
    };

    const ro = new ResizeObserver(() => {
      if (!map) {
        start();
        return;
      }
      hardResize(map, container);
      fitParks(map, parksRef.current);
    });
    ro.observe(container);

    const onWindowResize = () => {
      if (!map) return;
      hardResize(map, container);
      fitParks(map, parksRef.current);
    };
    window.addEventListener("resize", onWindowResize);

    requestAnimationFrame(start);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onWindowResize);
      ro.disconnect();
      tooltip.remove();
      tooltipRef.current = null;
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      map?.remove();
      map = null;
      mapRef.current = null;
    };
  }, [stateCode, navigate]);

  return (
    <div
      ref={containerRef}
      className="park-map"
      role="region"
      aria-label="Park map"
    />
  );
}
