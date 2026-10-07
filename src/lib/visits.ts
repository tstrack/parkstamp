import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Visit } from "../types";

interface ParkStampDB extends DBSchema {
  visits: {
    key: string;
    value: Visit;
  };
}

let dbPromise: Promise<IDBPDatabase<ParkStampDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ParkStampDB>("parkstamp", 1, {
      upgrade(db) {
        db.createObjectStore("visits", { keyPath: "parkId" });
      },
    });
  }
  return dbPromise;
}

export async function getAllVisits(): Promise<Map<string, Visit>> {
  const db = await getDb();
  const all = await db.getAll("visits");
  return new Map(all.map((v) => [v.parkId, v]));
}

export async function getVisit(parkId: string): Promise<Visit | undefined> {
  const db = await getDb();
  return db.get("visits", parkId);
}

export async function stampVisit(parkId: string): Promise<Visit> {
  const db = await getDb();
  const visit: Visit = { parkId, visitedAt: new Date().toISOString() };
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
): Promise<Visit | null> {
  if (currentlyVisited) {
    await unstampVisit(parkId);
    return null;
  }
  return stampVisit(parkId);
}
