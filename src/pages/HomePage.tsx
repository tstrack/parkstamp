import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Stamp } from "../components/Stamp";
import { loadCatalogIndex, loadStateCatalog } from "../lib/data";
import {
  formatStampDate,
  stampLabelForPark,
  stampRotationFromId,
  stampToneFromId,
} from "../lib/stamp";
import {
  parseParkId,
  parseSystemFilter,
  totalCountForFilter,
} from "../lib/systemFilter";
import { useVisits } from "../hooks/useVisits";
import type { Park } from "../types";

type StampEntry = {
  park: Park;
  visitedAt: string;
  stampedAt: string;
};

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const system = parseSystemFilter(searchParams.get("system"));
  const { visits, ready } = useVisits();
  const [entries, setEntries] = useState<StampEntry[]>([]);
  const [catalogTotals, setCatalogTotals] = useState<{
    totalParks: number;
    stateParkCount: number;
    nationalParkCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadCatalogIndex()
      .then((index) => {
        if (!cancelled) {
          setCatalogTotals({
            totalParks: index.totalParks,
            stateParkCount: index.stateParkCount,
            nationalParkCount: index.nationalParkCount,
          });
        }
      })
      .catch(() => {
        /* progress total is optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function loadStamps() {
      setLoading(true);
      setError(null);
      try {
        const stateCodes = new Set<string>();
        for (const parkId of visits.keys()) {
          const parsed = parseParkId(parkId);
          if (parsed) stateCodes.add(parsed.state.toLowerCase());
        }

        const catalogs = await Promise.all(
          [...stateCodes].map((code) => loadStateCatalog(code)),
        );
        if (cancelled) return;

        const byId = new Map<string, Park>();
        for (const catalog of catalogs) {
          for (const park of catalog.parks) byId.set(park.id, park);
        }

        const next: StampEntry[] = [];
        for (const [parkId, visit] of visits) {
          const park = byId.get(parkId);
          if (park) {
            next.push({
              park,
              visitedAt: visit.visitedAt,
              stampedAt: visit.stampedAt,
            });
          }
        }
        next.sort((a, b) => b.stampedAt.localeCompare(a.stampedAt));
        setEntries(next);
      } catch {
        if (!cancelled) setError("Could not load your stamps.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStamps();
    return () => {
      cancelled = true;
    };
  }, [visits, ready]);

  const filtered = useMemo(() => {
    if (system === "all") return entries;
    return entries.filter((e) => e.park.system === system);
  }, [entries, system]);

  const setSystem = (next: typeof system) => {
    setSearchParams(next === "all" ? {} : { system: next }, { replace: true });
  };

  const totalParks = catalogTotals
    ? totalCountForFilter(catalogTotals, system)
    : 0;

  const emptySlots =
    filtered.length === 0 ? 0 : filtered.length % 2 === 0 ? 0 : 1;

  return (
    <div className="page home-page">
      <div className="segmented" role="group" aria-label="Park system">
        <button
          type="button"
          className={`segmented__btn${system === "all" ? " segmented__btn--on" : ""}`}
          aria-pressed={system === "all"}
          onClick={() => setSystem("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`segmented__btn${system === "national" ? " segmented__btn--on" : ""}`}
          aria-pressed={system === "national"}
          onClick={() => setSystem("national")}
        >
          National
        </button>
        <button
          type="button"
          className={`segmented__btn${system === "state" ? " segmented__btn--on" : ""}`}
          aria-pressed={system === "state"}
          onClick={() => setSystem("state")}
        >
          State
        </button>
      </div>

      <p className="progress-chip" aria-live="polite">
        <strong>
          {filtered.length}
          {totalParks > 0 ? ` / ${totalParks}` : ""}
        </strong>{" "}
        parks stamped
      </p>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Opening your passport…</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="passport-empty">
          <p>No stamps yet.</p>
          <p>
            <Link to="/find">Find a park</Link> to stamp your first visit.
          </p>
        </div>
      )}

      {!loading && !error && (filtered.length > 0 || emptySlots > 0) && (
        <ul className="stamp-grid">
          {filtered.map(({ park, visitedAt }) => (
            <li key={park.id}>
              <Link
                className="stamp-slot"
                to={`/state/${park.state.toLowerCase()}/park/${park.id}`}
              >
                <Stamp
                  label={stampLabelForPark(park)}
                  date={formatStampDate(visitedAt)}
                  tone={stampToneFromId(park.id)}
                  rotation={stampRotationFromId(park.id)}
                  size={118}
                />
                <span className="stamp-slot__caption">{park.name}</span>
              </Link>
            </li>
          ))}
          {Array.from({ length: emptySlots }, (_, i) => (
            <li key={`empty-${i}`}>
              <Link className="stamp-slot" to="/states">
                <div className="stamp-slot__ring">Add a visit</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
