import { ArrowLeft } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { iconDefaults } from "../components/icons";
import { ParkListRow } from "../components/ParkListRow";
import { ProgressBar } from "../components/ProgressBar";
import { SearchField } from "../components/SearchField";
import { loadStateCatalog } from "../lib/data";
import { filterParksBySystem, parseSystemFilter } from "../lib/systemFilter";
import { useVisits } from "../hooks/useVisits";
import type { Park, SystemFilter } from "../types";

const ParkMap = lazy(() =>
  import("../components/ParkMap").then((m) => ({ default: m.ParkMap })),
);

type VisitFilter = "all" | "visited" | "unvisited";

function parseVisitFilter(params: URLSearchParams): VisitFilter {
  if (params.get("visited") === "1") return "visited";
  if (params.get("unvisited") === "1") return "unvisited";
  return "all";
}

export function StatePage() {
  const { code = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const system = parseSystemFilter(searchParams.get("system"));
  const visitFilter = parseVisitFilter(searchParams);

  const [parks, setParks] = useState<Park[]>([]);
  const [stateName, setStateName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { isVisited, getVisitedAt } = useVisits();

  useEffect(() => {
    setQuery("");
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadStateCatalog(code)
      .then((catalog) => {
        if (cancelled) return;
        setStateName(catalog.name);
        setParks(catalog.parks);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load parks for this state.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const setSystem = (next: SystemFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("system");
    else params.set("system", next);
    params.delete("view");
    setSearchParams(params, { replace: true });
  };

  const setVisitFilter = (next: VisitFilter) => {
    const params = new URLSearchParams(searchParams);
    params.delete("visited");
    params.delete("unvisited");
    params.delete("view");
    if (next === "visited") params.set("visited", "1");
    if (next === "unvisited") params.set("unvisited", "1");
    setSearchParams(params, { replace: true });
  };

  const toggleVisitFilter = (target: "visited" | "unvisited") => {
    setVisitFilter(visitFilter === target ? "all" : target);
  };

  const systemParks = useMemo(
    () => filterParksBySystem(parks, system),
    [parks, system],
  );

  const stampedCount = useMemo(
    () => systemParks.filter((p) => isVisited(p.id)).length,
    [systemParks, isVisited],
  );

  const filtered = useMemo(() => {
    let next = systemParks;
    if (visitFilter === "unvisited") {
      next = next.filter((p) => !isVisited(p.id));
    } else if (visitFilter === "visited") {
      next = next.filter((p) => isVisited(p.id));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      next = next.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.locationLabel.toLowerCase().includes(q),
      );
    }
    return next;
  }, [systemParks, visitFilter, isVisited, query]);

  const openPark = (park: Park) => {
    const qs = system !== "all" ? `?system=${system}` : "";
    navigate(`/state/${code.toLowerCase()}/park/${park.id}${qs}`);
  };

  return (
    <div className="page state-page">
      <p className="state-back">
        <Link to="/find">
          <ArrowLeft {...iconDefaults} size={18} />
          Back
        </Link>
      </p>
      <header className="state-header">
        <h1 className="state-header__title">{stateName || code.toUpperCase()}</h1>
        {!loading && systemParks.length > 0 && (
          <>
            <p className="state-header__progress">
              <strong>
                {stampedCount} / {systemParks.length}
              </strong>{" "}
              stamped
            </p>
            <ProgressBar
              value={stampedCount}
              max={systemParks.length}
              label={`${stampedCount} of ${systemParks.length} parks stamped`}
            />
          </>
        )}
      </header>

      <div className="filter-chips" role="group" aria-label="Park filters">
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
        <button
          type="button"
          className={`filter-chip filter-chip--toggle${visitFilter === "visited" ? " filter-chip--on" : ""}`}
          aria-pressed={visitFilter === "visited"}
          onClick={() => toggleVisitFilter("visited")}
        >
          Visited
        </button>
        <button
          type="button"
          className={`filter-chip filter-chip--toggle${visitFilter === "unvisited" ? " filter-chip--on" : ""}`}
          aria-pressed={visitFilter === "unvisited"}
          onClick={() => toggleVisitFilter("unvisited")}
        >
          Unvisited
        </button>
      </div>

      <div className="state-search">
        <SearchField
          value={query}
          onChange={setQuery}
          label={`Search parks in ${stateName || code.toUpperCase()}`}
          placeholder="Search parks in this state…"
        />
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading parks…</p>}

      {!loading && !error && (
        <div className="state-browse">
          <div className="state-browse__map">
            <Suspense fallback={<p className="muted">Loading map…</p>}>
              <ParkMap
                parks={filtered}
                stateCode={code.toUpperCase()}
                systemFilter={system}
                onSelectPark={openPark}
              />
            </Suspense>
          </div>

          <div className="state-browse__list-header">
            <p className="state-browse__count">
              {filtered.length} park{filtered.length === 1 ? "" : "s"}
              {query.trim() ? " match" : ""}
            </p>
            <span className="state-browse__sort muted">A to Z</span>
          </div>

          <ul className="passport-list state-park-list">
            {filtered.map((park) => (
              <li key={park.id}>
                <ParkListRow
                  park={park}
                  visited={isVisited(park.id)}
                  visitedAt={getVisitedAt(park.id)}
                  onClick={() => openPark(park)}
                />
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="muted list-empty">
                {query.trim()
                  ? "No parks match that search."
                  : "No parks match those filters."}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
