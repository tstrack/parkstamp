import { useEffect, useMemo, useRef } from "react";
import {
  LngLatBounds,
  Map,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../lib/maplibre";
import { MAP_STYLE } from "../lib/theme";
import { systemLabel } from "../lib/systemFilter";
import type { Park, SystemFilter } from "../types";
import { useTheme } from "../hooks/useTheme";
import { useVisits } from "../hooks/useVisits";

type Props = {
  parks: Park[];
  stateCode: string;
  systemFilter?: SystemFilter;
  selectedParkId?: string | null;
  onSelectPark?: (park: Park) => void;
};

/** Contiguous U.S. overview when no park markers are shown. */
const US_BOUNDS = new LngLatBounds([-125.0, 24.2], [-66.5, 49.5]);

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

function fitMap(map: Map, parks: Park[], animate = false) {
  const duration = animate ? 600 : 0;
  const bounds = boundsForParks(parks);
  if (!bounds || bounds.isEmpty()) {
    map.fitBounds(US_BOUNDS, { padding: 28, duration, maxZoom: 5 });
    return;
  }
  map.fitBounds(bounds, { padding: 48, maxZoom: 8, duration });
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
  selectedParkId = null,
  onSelectPark,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const tooltipRef = useRef<Popup | null>(null);
  const parksRef = useRef(parks);
  const visitedRef = useRef<Set<string>>(new Set());
  const selectedRef = useRef<string | null>(selectedParkId);
  const onSelectRef = useRef(onSelectPark);
  const { visits } = useVisits();
  const { resolved: theme } = useTheme();
  const themeRef = useRef(theme);
  const mapStyleRef = useRef(MAP_STYLE[theme]);
  const visitedIds = useMemo(() => new Set(visits.keys()), [visits]);
  const syncMarkersRef = useRef<() => void>(() => {});

  themeRef.current = theme;

  useEffect(() => {
    onSelectRef.current = onSelectPark;
  }, [onSelectPark]);

  useEffect(() => {
    parksRef.current = parks;
    visitedRef.current = visitedIds;
    selectedRef.current = selectedParkId;

    syncMarkersRef.current = () => {
      const map = mapRef.current;
      const container = containerRef.current;
      const tooltip = tooltipRef.current;
      if (!map || !container || !map.isStyleLoaded()) return;

      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];

      const currentParks = parksRef.current;
      const visited = visitedRef.current;
      const selected = selectedRef.current;

      // State: pine from stamp artwork. National: badge traced from preferred shield.
      const treePath = "M60 40l-10 17h5l-8 12h26l-8-12h5z";
      // Shallow peak, rounded shoulders, vertical sides, convex taper to tip.
      const shieldPath =
        "M10 1.2 16.8 3.1C17.8 3.5 18 4.1 18 5v6c0 4.2-4.2 6.6-8 8C6.2 17.6 2 15.2 2 11V5c0-.9.2-1.5 1.2-1.9Z";

      for (const park of currentParks) {
        const el = document.createElement("button");
        el.type = "button";
        const classes = ["map-marker", `map-marker--${park.system}`];
        if (visited.has(park.id)) classes.push("map-marker--visited");
        else classes.push("map-marker--unvisited");
        if (selected === park.id) classes.push("map-marker--selected");
        el.className = classes.join(" ");
        el.setAttribute("aria-label", park.name);

        if (park.system === "national") {
          el.innerHTML = `<svg class="map-marker__shield" viewBox="0 0 20 20" aria-hidden="true"><path class="map-marker__shield-path" d="${shieldPath}"/></svg>`;
        } else {
          el.innerHTML = `<svg class="map-marker__tree-only" viewBox="48 38 24 34" aria-hidden="true"><path class="map-marker__tree" d="${treePath}"/></svg>`;
        }

        el.addEventListener("click", (event) => {
          event.stopPropagation();
          tooltip?.remove();
          if (onSelectRef.current) {
            onSelectRef.current(park);
            return;
          }
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
      fitMap(map, currentParks, currentParks.length > 0);
    };

    syncMarkersRef.current();
  }, [parks, visitedIds, selectedParkId, stateCode, systemFilter]);

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

      const styleUrl = MAP_STYLE[themeRef.current];
      mapStyleRef.current = styleUrl;
      map = new Map({
        container,
        style: styleUrl,
        bounds: US_BOUNDS,
        fitBoundsOptions: { padding: 28 },
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
      fitMap(map, parksRef.current);
    });
    ro.observe(container);

    const onWindowResize = () => {
      if (!map) return;
      hardResize(map, container);
      fitMap(map, parksRef.current);
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
  }, [stateCode]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const styleUrl = MAP_STYLE[theme];
    if (mapStyleRef.current === styleUrl) return;
    mapStyleRef.current = styleUrl;

    map.setStyle(styleUrl);
    map.once("style.load", () => {
      hardResize(map, container);
      syncMarkersRef.current();
      map.once("idle", () => {
        hardResize(map, container);
        syncMarkersRef.current();
      });
    });
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="park-map"
      role="region"
      aria-label="Park map"
    />
  );
}
