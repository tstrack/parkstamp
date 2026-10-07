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

export type Visit = {
  parkId: string;
  visitedAt: string;
};
