export type ParkSystem = "state" | "national";

export type SystemFilter = "all" | ParkSystem;

export type Park = {
  id: string;
  name: string;
  state: string;
  system: ParkSystem;
  lat: number;
  lng: number;
  locationLabel: string;
};

export type StateIndexEntry = {
  code: string;
  name: string;
  parkCount: number;
  stateParkCount: number;
  nationalParkCount: number;
};

export type CatalogIndex = {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  filter: string;
  states: StateIndexEntry[];
  totalParks: number;
  stateParkCount: number;
  nationalParkCount: number;
};

export type StateCatalog = {
  state: string;
  name: string;
  parks: Park[];
};

/** Visit date is YYYY-MM-DD; stampedAt is when the stamp was created. */
export type Visit = {
  parkId: string;
  visitedAt: string;
  stampedAt: string;
};
