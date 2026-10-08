/** Today's date as local YYYY-MM-DD. */
export function todayIsoDate(): string {
  const d = new Date();
  return toIsoDate(d);
}

/** Format a Date as local YYYY-MM-DD. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse ISO date (YYYY-MM-DD) or datetime into a local Date at noon
 * to avoid UTC off-by-one for date-only strings.
 */
export function parseLocalDate(iso: string): Date {
  const dateOnly = iso.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && iso.length <= 10) {
    const [y, m, d] = dateOnly.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    const [y, m, d] = dateOnly.split("-").map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1, 12, 0, 0);
  }
  // If the original looked like a date-only embedded in a datetime UTC midnight,
  // prefer the calendar date portion in local terms from the string.
  if (/^\d{4}-\d{2}-\d{2}/.test(iso) && iso.includes("T")) {
    // Legacy stamps: use the instant's local calendar date.
    return parsed;
  }
  return parsed;
}

/** Normalize any ISO datetime or date to YYYY-MM-DD (local calendar for datetimes). */
export function toVisitDate(iso: string): string {
  const dateOnly = iso.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly) && !iso.includes("T")) {
    return dateOnly;
  }
  return toIsoDate(parseLocalDate(iso));
}

/** Clamp a visit date so it is never in the future. */
export function clampVisitDate(isoDate: string): string {
  const today = todayIsoDate();
  const normalized = toVisitDate(isoDate);
  return normalized > today ? today : normalized;
}
