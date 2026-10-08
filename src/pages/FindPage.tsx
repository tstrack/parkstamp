import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ParkListRow } from "../components/ParkListRow";
import { ProgressBar } from "../components/ProgressBar";
import { SearchField } from "../components/SearchField";
import { StatePicker } from "../components/StatePicker";
import { loadAllParks, loadCatalogIndex } from "../lib/data";
import {
  filterParksBySystem,
  parkCountForFilter,
  parseParkId,
  parseSystemFilter,
} from "../lib/systemFilter";
import { useVisits } from "../hooks/useVisits";
import type { CatalogIndex, Park, SystemFilter } from "../types";

const SEARCH_LIMIT = 200;

export function FindPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const stateParam = searchParams.get("state");
  const system = parseSystemFilter(searchParams.get("system"));
  const urlQuery = searchParams.get("q") ?? "";

  const legacyState =
    stateParam && /^[a-z]{2}$/i.test(stateParam.trim())
      ? stateParam.trim().toLowerCase()
      : null;

  const [query, setQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  const [index, setIndex] = useState<CatalogIndex | null>(null);
  const [allParks, setAllParks] = useState<Park[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { visits, isVisited, getVisitedAt, ready } = useVisits();

  useEffect(() => {
    let cancelled = false;
    loadCatalogIndex()
      .then((data) => {
        if (!cancelled) setIndex(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load park catalog.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAllParks()
      .then((data) => {
        if (!cancelled) setAllParks(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load parks.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (legacyState) return;
    const handle = window.setTimeout(() => {
      if (query.trim() === urlQuery.trim()) return;
      const params = new URLSearchParams();
      if (system !== "all") params.set("system", system);
      if (query.trim()) params.set("q", query.trim());
      setSearchParams(params, { replace: true });
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query, urlQuery, system, setSearchParams, legacyState]);

  const setSystem = (next: SystemFilter) => {
    const params = new URLSearchParams();
    if (next !== "all") params.set("system", next);
    if (query.trim()) params.set("q", query.trim());
    setSearchParams(params, { replace: true });
  };

  const yourStates = useMemo(() => {
    if (!index || !ready) return [];
    const lastStamped = new Map<string, string>();
    const stampedCounts = new Map<string, number>();

    for (const [parkId, visit] of visits) {
      const parsed = parseParkId(parkId);
      if (!parsed) continue;
      const code = parsed.state.toUpperCase();
      stampedCounts.set(code, (stampedCounts.get(code) ?? 0) + 1);
      const prev = lastStamped.get(code);
      if (!prev || visit.stampedAt > prev) {
        lastStamped.set(code, visit.stampedAt);
      }
    }

    return index.states
      .filter((s) => (stampedCounts.get(s.code) ?? 0) > 0)
      .map((s) => ({
        code: s.code,
        name: s.name,
        visited: stampedCounts.get(s.code) ?? 0,
        total: parkCountForFilter(s, "all"),
        lastStamped: lastStamped.get(s.code) ?? "",
      }))
      .sort((a, b) => b.lastStamped.localeCompare(a.lastStamped));
  }, [index, visits, ready]);

  const searching = query.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!searching) return [];
    const q = query.trim().toLowerCase();
    const systemParks = filterParksBySystem(allParks, system);
    return systemParks
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.locationLabel.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q),
      )
      .slice(0, SEARCH_LIMIT);
  }, [searching, query, allParks, system]);

  const openPark = (park: Park) => {
    navigate(`/state/${park.state.toLowerCase()}/park/${park.id}`);
  };

  if (legacyState) {
    const params = new URLSearchParams();
    if (system !== "all") params.set("system", system);
    if (searchParams.get("unvisited") === "1") params.set("unvisited", "1");
    if (searchParams.get("view") === "list") params.set("view", "list");
    const qs = params.toString();
    return (
      <Navigate to={`/state/${legacyState}${qs ? `?${qs}` : ""}`} replace />
    );
  }

  return (
    <div className="page find-page">
      <h1 className="page-title find-page__title">Find</h1>

      <div className="find-search">
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search parks"
          placeholder="Search parks…"
        />
      </div>

      {error && <p className="error">{error}</p>}

      {searching ? (
        <>
          <div className="filter-chips" role="group" aria-label="Park system">
            {(
              [
                ["all", "All"],
                ["national", "National"],
                ["state", "State"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`filter-chip${system === value ? " filter-chip--on" : ""}`}
                aria-pressed={system === value}
                onClick={() => setSystem(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="passport-list">
            {searchResults.map((park) => (
              <li key={park.id}>
                <ParkListRow
                  park={park}
                  visited={isVisited(park.id)}
                  visitedAt={getVisitedAt(park.id)}
                  showState
                  onClick={() => openPark(park)}
                />
              </li>
            ))}
            {searchResults.length === 0 && (
              <li className="muted list-empty">No parks match that search.</li>
            )}
          </ul>
          {searchResults.length >= SEARCH_LIMIT && (
            <p className="muted find-list-note">
              Showing first {SEARCH_LIMIT} results — refine your search.
            </p>
          )}
        </>
      ) : (
        <>
          {ready && yourStates.length === 0 && (
            <div className="content-card find-empty">
              <p className="find-empty__lead">Start your first stamp</p>
              <p>
                Search for a park by name, or browse a state to begin filling
                your passport.
              </p>
            </div>
          )}

          {yourStates.length > 0 && (
            <section className="your-states" aria-label="Your states">
              <h2 className="your-states__heading">Your states</h2>
              <ul className="your-states__list">
                {yourStates.map((s) => (
                  <li key={s.code}>
                    <button
                      type="button"
                      className="state-progress-card"
                      onClick={() =>
                        navigate(`/state/${s.code.toLowerCase()}`)
                      }
                    >
                      <div className="state-progress-card__top">
                        <span className="state-progress-card__name">
                          {s.name}
                        </span>
                        <span className="state-progress-card__count">
                          {s.visited} / {s.total}
                        </span>
                      </div>
                      <ProgressBar
                        value={s.visited}
                        max={s.total}
                        label={`${s.name} progress`}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {index && (
            <StatePicker
              states={index.states}
              open={pickerOpen}
              onToggle={() => setPickerOpen((v) => !v)}
              onSelect={(code) => navigate(`/state/${code}`)}
            />
          )}
        </>
      )}
    </div>
  );
}
