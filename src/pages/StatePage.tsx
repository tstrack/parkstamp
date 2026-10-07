import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { SearchField } from "../components/SearchField";
import { SystemFilterSelect } from "../components/SystemFilterSelect";
import { loadStateCatalog } from "../lib/data";
import {
  filterParksBySystem,
  parseSystemFilter,
  systemLabel,
} from "../lib/systemFilter";
import { useVisits } from "../hooks/useVisits";
import type { StateCatalog, SystemFilter } from "../types";

const ParkMap = lazy(() =>
  import("../components/ParkMap").then((m) => ({ default: m.ParkMap })),
);

function buildParams(view: "map" | "list", system: SystemFilter) {
  const params = new URLSearchParams();
  if (view === "list") params.set("view", "list");
  if (system !== "all") params.set("system", system);
  return params;
}

export function StatePage() {
  const { code = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "list" ? "list" : "map";
  const system = parseSystemFilter(searchParams.get("system"));
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState<StateCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { isVisited } = useVisits();

  useEffect(() => {
    let cancelled = false;
    loadStateCatalog(code)
      .then((data) => {
        if (!cancelled) {
          setCatalog(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog(null);
          setError("Could not load parks for this state.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const activeCatalog =
    catalog && catalog.state.toLowerCase() === code.toLowerCase()
      ? catalog
      : null;

  const systemParks = useMemo(() => {
    if (!activeCatalog) return [];
    return filterParksBySystem(activeCatalog.parks, system);
  }, [activeCatalog, system]);

  const parks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return systemParks.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.locationLabel.toLowerCase().includes(q),
    );
  }, [systemParks, query]);

  const visitedInState = useMemo(() => {
    return systemParks.filter((p) => isVisited(p.id)).length;
  }, [systemParks, isVisited]);

  const setView = (next: "list" | "map") => {
    setSearchParams(buildParams(next, system), { replace: true });
  };

  const setSystem = (next: SystemFilter) => {
    setSearchParams(buildParams(view, next), { replace: true });
  };

  const parkHref = (parkId: string, nextView: "list" | "map") => {
    const params = buildParams(nextView, system);
    const qs = params.toString();
    return `/state/${code.toLowerCase()}/park/${parkId}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="page state-page">
      <header className="page-header">
        <Link
          className="back-link"
          to={system === "all" ? "/" : `/?system=${system}`}
        >
          ← All states
        </Link>
        <div className="page-header__title-row">
          <h1 className="page-title">
            {activeCatalog?.name ?? code.toUpperCase()}
          </h1>
          <div className="view-toggle view-toggle--compact" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === "map"}
              className={view === "map" ? "is-active" : ""}
              onClick={() => setView("map")}
            >
              Map
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={view === "list" ? "is-active" : ""}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>
        </div>
        {activeCatalog && (
          <p className="progress-line">
            <strong>
              {visitedInState} / {systemParks.length}
            </strong>{" "}
            parks stamped
          </p>
        )}
      </header>

      <div className="page-toolbar">
        <SearchField
          label="Search parks"
          placeholder="Search parks…"
          value={query}
          onChange={setQuery}
        />
        <SystemFilterSelect value={system} onChange={setSystem} />
      </div>

      {error && <p className="error">{error}</p>}
      {!activeCatalog && !error && <p className="muted">Loading parks…</p>}

      {activeCatalog && view === "list" && (
        <ul className="passport-list">
          {parks.map((park) => {
            const visited = isVisited(park.id);
            return (
              <li key={park.id}>
                <button
                  type="button"
                  className={`passport-row park-row ${visited ? "park-row--visited" : ""} park-row--${park.system}`}
                  onClick={() => navigate(parkHref(park.id, "list"))}
                >
                  <span className="passport-row__name">{park.name}</span>
                  <span className="passport-row__meta">
                    {systemLabel(park.system)} · {park.locationLabel}
                  </span>
                  {visited && (
                    <span className="stamp-badge" aria-label="Visited">
                      stamped
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {parks.length === 0 && (
            <li className="muted">No parks match that search.</li>
          )}
        </ul>
      )}

      {activeCatalog && view === "map" && (
        <Suspense fallback={<p className="muted">Loading map…</p>}>
          <ParkMap parks={parks} stateCode={code} systemFilter={system} />
        </Suspense>
      )}

      <footer className="page-footer">
        <Link to="/about">About &amp; data credits</Link>
      </footer>
    </div>
  );
}
