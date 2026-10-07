import type { Park, ParkSystem, StateIndexEntry, SystemFilter } from "../types";

export function parseSystemFilter(value: string | null): SystemFilter {
  if (value === "state" || value === "national") return value;
  return "all";
}

export function parkCountForFilter(
  entry: Pick<
    StateIndexEntry,
    "parkCount" | "stateParkCount" | "nationalParkCount"
  >,
  filter: SystemFilter,
): number {
  if (filter === "state") return entry.stateParkCount;
  if (filter === "national") return entry.nationalParkCount;
  return entry.parkCount;
}

export function totalCountForFilter(
  totals: {
    totalParks: number;
    stateParkCount: number;
    nationalParkCount: number;
  },
  filter: SystemFilter,
): number {
  if (filter === "state") return totals.stateParkCount;
  if (filter === "national") return totals.nationalParkCount;
  return totals.totalParks;
}

/** Park ids look like `mn-state-afton-state-park` or `mn-national-voyageurs…`. */
export function parseParkId(
  parkId: string,
): { state: string; system: ParkSystem } | null {
  const match = /^([a-z]{2})-(state|national)-/i.exec(parkId);
  if (!match) return null;
  return {
    state: match[1].toUpperCase(),
    system: match[2] as ParkSystem,
  };
}

export function filterParksBySystem(
  parks: Park[],
  filter: SystemFilter,
): Park[] {
  if (filter === "all") return parks;
  return parks.filter((p) => p.system === filter);
}

export function systemLabel(system: ParkSystem): string {
  return system === "national" ? "National Park" : "State Park";
}
