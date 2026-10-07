import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { StampLogo } from "../components/StampLogo";
import { formatVisitDate, loadStateCatalog, mapsUrl } from "../lib/data";
import { parseSystemFilter, systemLabel } from "../lib/systemFilter";
import { useVisits } from "../hooks/useVisits";
import type { Park } from "../types";

export function ParkPage() {
  const { code = "", parkId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") === "list" ? "list" : "map";
  const system = parseSystemFilter(searchParams.get("system"));
  const [park, setPark] = useState<Park | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const { isVisited, getVisitedAt, toggle } = useVisits();

  useEffect(() => {
    loadStateCatalog(code)
      .then((catalog) => {
        const found = catalog.parks.find((p) => p.id === parkId) ?? null;
        setPark(found);
        if (!found) setError("Park not found.");
      })
      .catch(() => setError("Could not load park."));
  }, [code, parkId]);

  const visited = park ? isVisited(park.id) : false;
  const visitedAt = park ? getVisitedAt(park.id) : undefined;

  const onStamp = async () => {
    if (!park) return;
    if (!visited) {
      setAnimating(true);
      window.setTimeout(() => setAnimating(false), 450);
    }
    await toggle(park.id);
  };

  const backParams = new URLSearchParams();
  if (view === "list") backParams.set("view", "list");
  if (system !== "all") backParams.set("system", system);
  const backQs = backParams.toString();
  const backTo = `/state/${code.toLowerCase()}${backQs ? `?${backQs}` : ""}`;

  return (
    <div className="page park-page">
      <header className="page-header">
        <Link className="back-link" to={backTo}>
          ← Back to {code.toUpperCase()}
        </Link>
      </header>

      {error && <p className="error">{error}</p>}
      {!park && !error && <p className="muted">Loading…</p>}

      {park && (
        <>
          <p className={`park-system park-system--${park.system}`}>
            {systemLabel(park.system)}
          </p>
          <h1 className="page-title">{park.name}</h1>
          <p className="park-location">{park.locationLabel}</p>
          <a
            className="maps-link"
            href={mapsUrl(park.lat, park.lng, park.name)}
            target="_blank"
            rel="noreferrer"
          >
            Open in Maps
          </a>

          <div className="stamp-stage">
            <button
              type="button"
              className={`stamp-button ${visited ? "is-stamped" : ""} ${animating ? "is-animating" : ""}`}
              onClick={onStamp}
              aria-pressed={visited}
            >
              <StampLogo
                size={160}
                variant={visited ? "stamp" : "outline"}
                stamped={visited}
              />
              <span className="stamp-button__label">
                {visited ? "Stamped" : "Tap to stamp"}
              </span>
            </button>
            {visited && visitedAt && (
              <p className="stamp-date">{formatVisitDate(visitedAt)}</p>
            )}
            {visited && (
              <button type="button" className="text-button" onClick={onStamp}>
                Remove stamp
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
