import { parseLocalDate } from "./dates";

export type StampTone = "rust" | "forest" | "blue";

function hashParkId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function stampToneFromId(id: string): StampTone {
  const tones: StampTone[] = ["rust", "forest", "blue"];
  return tones[hashParkId(id) % tones.length];
}

export function stampRotationFromId(id: string): number {
  return (hashParkId(id) % 17) - 8;
}

export function stampLabelForPark(park: { name: string; state: string }): string {
  return `${park.name.toUpperCase()} • ${park.state.toUpperCase()} •`;
}

/** Stamp ring date: `14 JUL 2025` */
export function formatStampDate(iso: string): string {
  try {
    const d = parseLocalDate(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return iso.slice(0, 10).toUpperCase();
  }
}

/** Short list date: `Oct 2026` */
export function formatVisitMonth(iso: string): string {
  try {
    const d = parseLocalDate(iso);
    const month = d.toLocaleString("en-US", { month: "short" });
    return `${month} ${d.getFullYear()}`;
  } catch {
    return iso.slice(0, 7);
  }
}
