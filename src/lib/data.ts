import type { CatalogIndex, Park, StateCatalog } from "../types";

const indexCache = new Map<string, Promise<unknown>>();
let allParksPromise: Promise<Park[]> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const existing = indexCache.get(url);
  if (existing) return existing as Promise<T>;
  const promise = fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    return res.json() as Promise<T>;
  });
  indexCache.set(url, promise);
  return promise;
}

export function loadCatalogIndex(): Promise<CatalogIndex> {
  return fetchJson<CatalogIndex>("/data/index.json");
}

export function loadStateCatalog(code: string): Promise<StateCatalog> {
  return fetchJson<StateCatalog>(`/data/states/${code.toLowerCase()}.json`);
}

/** Load parks for one state (uses the shared JSON cache). */
export async function loadParksForState(code: string): Promise<Park[]> {
  const catalog = await loadStateCatalog(code);
  return catalog.parks;
}

/** Load every park catalog once; subsequent calls reuse the promise. */
export function loadAllParks(): Promise<Park[]> {
  if (!allParksPromise) {
    allParksPromise = loadCatalogIndex().then(async (index) => {
      const catalogs = await Promise.all(
        index.states.map((entry) => loadStateCatalog(entry.code)),
      );
      return catalogs.flatMap((catalog) => catalog.parks);
    });
  }
  return allParksPromise;
}

export function mapsUrl(lat: number, lng: number, name: string): string {
  const q = encodeURIComponent(`${name} @${lat},${lng}`);
  return `https://maps.google.com/?q=${q}`;
}

export { formatVisitMonth as formatVisitDate } from "./stamp";
