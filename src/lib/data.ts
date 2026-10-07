import type { CatalogIndex, StateCatalog } from "../types";

const indexCache = new Map<string, Promise<unknown>>();

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

export function mapsUrl(lat: number, lng: number, name: string): string {
  const q = encodeURIComponent(`${name} @${lat},${lng}`);
  return `https://maps.google.com/?q=${q}`;
}

export function formatVisitDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
