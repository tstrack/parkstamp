/**
 * Build ParkStamp catalog from USGS PAD-US (Des_Tp = SP | NP) + county labels.
 *
 * Usage: npx tsx scripts/build-park-catalog.ts
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import centroid from "@turf/centroid";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "data");
const CACHE_DIR = path.join(ROOT, "scripts", ".cache");

const PADUS_URL =
  "https://edits.nationalmap.gov/arcgis/rest/services/PAD-US/PAD_US_gaz_combined/MapServer/0/query";
const COUNTIES_URL =
  "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

type ParkSystem = "state" | "national";

export type Park = {
  id: string;
  name: string;
  state: string;
  system: ParkSystem;
  lat: number;
  lng: number;
  locationLabel: string;
};

type PadusProps = {
  Unit_Nm?: string;
  Loc_Nm?: string;
  State_Nm?: string;
  Des_Tp?: string;
};

function systemFromDesTp(desTp: string | undefined): ParkSystem | null {
  if (desTp === "SP") return "state";
  if (desTp === "NP") return "national";
  return null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "'")
    .trim();
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

async function fetchPadusPage(offset: number): Promise<FeatureCollection> {
  const params = new URLSearchParams({
    where: "Des_Tp='SP' OR Des_Tp='NP'",
    outFields: "Unit_Nm,Loc_Nm,State_Nm,Des_Tp",
    returnGeometry: "true",
    outSR: "4326",
    geometryPrecision: "5",
    resultOffset: String(offset),
    resultRecordCount: "1000",
    f: "geojson",
  });
  return fetchJson<FeatureCollection>(`${PADUS_URL}?${params}`);
}

async function loadCounties(): Promise<FeatureCollection> {
  await mkdir(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, "counties.json");
  if (existsSync(cachePath)) {
    return JSON.parse(await readFile(cachePath, "utf8")) as FeatureCollection;
  }
  console.log("Downloading county boundaries…");
  const data = await fetchJson<FeatureCollection>(COUNTIES_URL);
  await writeFile(cachePath, JSON.stringify(data));
  return data;
}

function countyLabel(
  lat: number,
  lng: number,
  state: string,
  counties: FeatureCollection,
): string {
  const pt = point([lng, lat]);
  for (const feature of counties.features) {
    const props = feature.properties as { NAME?: string; STATE?: string } | null;
    if (!props?.NAME) continue;
    try {
      if (
        feature.geometry &&
        (feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon") &&
        booleanPointInPolygon(
          pt,
          feature as Feature<Polygon | MultiPolygon>,
        )
      ) {
        const name = props.NAME.endsWith("County")
          ? props.NAME
          : `${props.NAME} County`;
        return `${name}, ${state}`;
      }
    } catch {
      // skip invalid geometries
    }
  }
  return state;
}

async function main() {
  console.log("Fetching PAD-US parks (Des_Tp = SP | NP)…");
  const rawFeatures: Feature[] = [];
  let offset = 0;
  for (;;) {
    const page = await fetchPadusPage(offset);
    const count = page.features?.length ?? 0;
    console.log(`  offset ${offset}: ${count} features`);
    if (!count) break;
    rawFeatures.push(...page.features);
    if (count < 1000) break;
    offset += count;
  }

  type Acc = {
    name: string;
    state: string;
    system: ParkSystem;
    lats: number[];
    lngs: number[];
  };
  const groups = new Map<string, Acc>();

  for (const feature of rawFeatures) {
    const props = feature.properties as PadusProps | null;
    const state = (props?.State_Nm ?? "").toUpperCase();
    if (!(state in STATE_NAMES)) continue;
    const system = systemFromDesTp(props?.Des_Tp);
    if (!system) continue;
    const name = (props?.Unit_Nm || props?.Loc_Nm || "").trim();
    if (!name) continue;
    if (!feature.geometry) continue;

    let lat: number;
    let lng: number;
    try {
      const c = centroid(feature as Feature<Polygon | MultiPolygon>);
      lng = c.geometry.coordinates[0];
      lat = c.geometry.coordinates[1];
    } catch {
      continue;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const key = `${state}::${system}::${normalizeName(name)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.lats.push(lat);
      existing.lngs.push(lng);
    } else {
      groups.set(key, { name, state, system, lats: [lat], lngs: [lng] });
    }
  }

  console.log(`Deduped to ${groups.size} parks across 50 states`);
  const counties = await loadCounties();

  const byState = new Map<string, Park[]>();
  for (const acc of groups.values()) {
    const lat = acc.lats.reduce((a, b) => a + b, 0) / acc.lats.length;
    const lng = acc.lngs.reduce((a, b) => a + b, 0) / acc.lngs.length;
    const park: Park = {
      id: `${acc.state.toLowerCase()}-${acc.system}-${slugify(acc.name)}`,
      name: acc.name,
      state: acc.state,
      system: acc.system,
      lat: Math.round(lat * 1e5) / 1e5,
      lng: Math.round(lng * 1e5) / 1e5,
      locationLabel: countyLabel(lat, lng, acc.state, counties),
    };
    const list = byState.get(acc.state) ?? [];
    list.push(park);
    byState.set(acc.state, list);
  }

  await mkdir(path.join(OUT_DIR, "states"), { recursive: true });

  let totalState = 0;
  let totalNational = 0;

  const states = Object.keys(STATE_NAMES)
    .sort()
    .map((code) => {
      const parks = (byState.get(code) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const stateParkCount = parks.filter((p) => p.system === "state").length;
      const nationalParkCount = parks.filter(
        (p) => p.system === "national",
      ).length;
      totalState += stateParkCount;
      totalNational += nationalParkCount;
      return {
        code,
        name: STATE_NAMES[code],
        parkCount: parks.length,
        stateParkCount,
        nationalParkCount,
      };
    });

  const index = {
    generatedAt: new Date().toISOString(),
    source:
      "U.S. Geological Survey (USGS) Gap Analysis Project (GAP), Protected Areas Database of the United States (PAD-US) 4.1",
    sourceUrl: "https://doi.org/10.5066/P96WBCHS",
    filter: "Des_Tp = SP (State Park) OR NP (National Park)",
    states,
    totalParks: totalState + totalNational,
    stateParkCount: totalState,
    nationalParkCount: totalNational,
  };

  for (const code of Object.keys(STATE_NAMES)) {
    const parks = (byState.get(code) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const seen = new Map<string, number>();
    for (const park of parks) {
      const n = (seen.get(park.id) ?? 0) + 1;
      seen.set(park.id, n);
      if (n > 1) park.id = `${park.id}-${n}`;
    }
    await writeFile(
      path.join(OUT_DIR, "states", `${code.toLowerCase()}.json`),
      JSON.stringify({ state: code, name: STATE_NAMES[code], parks }),
    );
  }

  await writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify(index, null, 2),
  );

  console.log(
    `Wrote ${index.totalParks} parks (${totalState} state, ${totalNational} national) → public/data/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
