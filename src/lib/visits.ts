import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Visit } from "../types";
import { clampVisitDate, todayIsoDate, toVisitDate } from "./dates";

interface ParkStampDB extends DBSchema {
  visits: {
    key: string;
    value: Visit;
  };
}

type LegacyVisit = {
  parkId: string;
  visitedAt: string;
  stampedAt?: string;
};

let dbPromise: Promise<IDBPDatabase<ParkStampDB>> | null = null;

function normalizeVisit(raw: LegacyVisit): Visit {
  const stampedAt = raw.stampedAt ?? raw.visitedAt;
  const visitedAt = toVisitDate(raw.visitedAt);
  return {
    parkId: raw.parkId,
    visitedAt,
    stampedAt,
  };
}

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ParkStampDB>("parkstamp", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore("visits", { keyPath: "parkId" });
        }
        // v2 field normalization runs lazily in migrateIfNeeded on read.
      },
    });
  }
  return dbPromise;
}

async function migrateIfNeeded(
  db: IDBPDatabase<ParkStampDB>,
): Promise<void> {
  const all = (await db.getAll("visits")) as LegacyVisit[];
  for (const row of all) {
    if (!row.stampedAt || row.visitedAt.includes("T")) {
      await db.put("visits", normalizeVisit(row));
    }
  }
}

export async function getAllVisits(): Promise<Map<string, Visit>> {
  const db = await getDb();
  await migrateIfNeeded(db);
  const all = await db.getAll("visits");
  return new Map(all.map((v) => [v.parkId, normalizeVisit(v)]));
}

export async function getVisit(parkId: string): Promise<Visit | undefined> {
  const db = await getDb();
  const raw = (await db.get("visits", parkId)) as LegacyVisit | undefined;
  return raw ? normalizeVisit(raw) : undefined;
}

export async function stampVisit(
  parkId: string,
  visitDate?: string,
): Promise<Visit> {
  const db = await getDb();
  const existing = (await db.get("visits", parkId)) as LegacyVisit | undefined;
  const stampedAt = existing?.stampedAt ?? new Date().toISOString();
  const visit: Visit = {
    parkId,
    visitedAt: clampVisitDate(visitDate ?? todayIsoDate()),
    stampedAt,
  };
  await db.put("visits", visit);
  return visit;
}

export async function updateVisitDate(
  parkId: string,
  visitDate: string,
): Promise<Visit | undefined> {
  const db = await getDb();
  const existing = await getVisit(parkId);
  if (!existing) return undefined;
  const visit: Visit = {
    ...existing,
    visitedAt: clampVisitDate(visitDate),
  };
  await db.put("visits", visit);
  return visit;
}

export async function unstampVisit(parkId: string): Promise<void> {
  const db = await getDb();
  await db.delete("visits", parkId);
}

export async function toggleVisit(
  parkId: string,
  currentlyVisited: boolean,
  visitDate?: string,
): Promise<Visit | null> {
  if (currentlyVisited) {
    await unstampVisit(parkId);
    return null;
  }
  return stampVisit(parkId, visitDate);
}
