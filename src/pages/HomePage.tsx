import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StampLogo } from "../components/StampLogo";
import { SearchField } from "../components/SearchField";
import { SystemFilterSelect } from "../components/SystemFilterSelect";
import { loadCatalogIndex } from "../lib/data";
import {
  parkCountForFilter,
  parseParkId,
  parseSystemFilter,
  totalCountForFilter,
} from "../lib/systemFilter";
import { useVisits } from "../hooks/useVisits";
import type { CatalogIndex } from "../types";

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const system = parseSystemFilter(searchParams.get("system"));
  const [index, setIndex] = useState<CatalogIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { visits } = useVisits();

  useEffect(() => {
    loadCatalogIndex()
      .then(setIndex)
      .catch(() => setError("Could not load park catalog."));
  }, []);

  const setSystem = (next: typeof system) => {
    setSearchParams(next === "all" ? {} : { system: next }, { replace: true });
  };

  const stateProgress = useMemo(() => {
    const counts = new Map<string, number>();
    for (const parkId of visits.keys()) {
      const parsed = parseParkId(parkId);
      if (!parsed) continue;
      if (system !== "all" && parsed.system !== system) continue;
      counts.set(parsed.state, (counts.get(parsed.state) ?? 0) + 1);
    }
    return counts;
  }, [visits, system]);

  const visitedCount = useMemo(() => {
    let n = 0;
    for (const count of stateProgress.values()) n += count;
    return n;
  }, [stateProgress]);

  const states = useMemo(() => {
    if (!index) return [];
    const q = query.trim().toLowerCase();
    return index.states
      .filter((s) => parkCountForFilter(s, system) > 0)
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [index, query, system]);

  const statesStarted = useMemo(() => {
    let n = 0;
    for (const count of stateProgress.values()) if (count > 0) n += 1;
    return n;
  }, [stateProgress]);

  const totalParks = index ? totalCountForFilter(index, system) : 0;

  return (
    <div className="page home-page">
      <header className="hero">
        <StampLogo size={88} variant="ink" className="hero-logo" />
        <h1 className="brand">ParkStamp</h1>
        <p className="pitch">Stamp the parks you’ve visited.</p>
        {index && (
          <p className="progress-line" aria-live="polite">
            <strong>
              {visitedCount} / {totalParks}
            </strong>{" "}
            parks · {statesStarted} states started
          </p>
        )}
      </header>

      <div className="page-toolbar">
        <SearchField
          label="Search states"
          placeholder="Search states…"
          value={query}
          onChange={setQuery}
        />
        <SystemFilterSelect value={system} onChange={setSystem} />
      </div>

      {error && <p className="error">{error}</p>}
      {!index && !error && <p className="muted">Opening your passport…</p>}

      {index && (
        <ul className="passport-list">
          {states.map((state) => {
            const visited = stateProgress.get(state.code) ?? 0;
            const total = parkCountForFilter(state, system);
            const href =
              system === "all"
                ? `/state/${state.code.toLowerCase()}`
                : `/state/${state.code.toLowerCase()}?system=${system}`;
            return (
              <li key={state.code}>
                <Link
                  className={`passport-row ${visited > 0 ? "passport-row--started" : ""}`}
                  to={href}
                >
                  <span className="passport-row__name">{state.name}</span>
                  <span className="passport-row__meta">
                    {visited} / {total}
                  </span>
                  <span className="passport-row__chevron" aria-hidden>
                    ›
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="page-footer">
        <Link to="/about">About &amp; data credits</Link>
      </footer>
    </div>
  );
}
