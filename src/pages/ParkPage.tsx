import { ArrowLeft, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { iconDefaults } from "../components/icons";
import { Stamp } from "../components/Stamp";
import { todayIsoDate } from "../lib/dates";
import { loadStateCatalog, mapsUrl } from "../lib/data";
import {
  formatStampDate,
  stampLabelForPark,
  stampRotationFromId,
  stampToneFromId,
} from "../lib/stamp";
import { parseSystemFilter, systemLabel } from "../lib/systemFilter";
import { useVisits } from "../hooks/useVisits";
import type { Park } from "../types";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ParkPage() {
  const { code = "", parkId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const system = parseSystemFilter(searchParams.get("system"));
  const [park, setPark] = useState<Park | null>(null);
  const [stateName, setStateName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [visitDate, setVisitDate] = useState(todayIsoDate());
  const [editingDate, setEditingDate] = useState(false);
  const { isVisited, getVisitedAt, stamp, updateDate, unstamp } = useVisits();

  useEffect(() => {
    loadStateCatalog(code)
      .then((catalog) => {
        setStateName(catalog.name);
        const found = catalog.parks.find((p) => p.id === parkId) ?? null;
        setPark(found);
        if (!found) setError("Park not found.");
      })
      .catch(() => setError("Could not load park."));
  }, [code, parkId]);

  const visited = park ? isVisited(park.id) : false;
  const visitedAt = park ? getVisitedAt(park.id) : undefined;
  const today = todayIsoDate();
  const backTo = `/state/${code.toLowerCase()}${
    system !== "all" ? `?system=${system}` : ""
  }`;
  const backLabel = stateName || code.toUpperCase();

  useEffect(() => {
    if (visited && visitedAt) {
      setVisitDate(visitedAt);
    } else if (!visited) {
      setVisitDate(todayIsoDate());
    }
    setEditingDate(false);
  }, [parkId, visited, visitedAt]);

  const onStamp = async () => {
    if (!park || visited) return;
    if (!prefersReducedMotion()) {
      setAnimating(true);
      window.setTimeout(() => setAnimating(false), 380);
    }
    await stamp(park.id, visitDate);
  };

  const onRemove = async () => {
    if (!park) return;
    await unstamp(park.id);
  };

  const onSaveDate = async () => {
    if (!park) return;
    await updateDate(park.id, visitDate);
    setEditingDate(false);
  };

  return (
    <div className="page park-page">
      {error && <p className="error">{error}</p>}
      {!park && !error && <p className="muted">Loading…</p>}

      {park && (
        <>
          <p className={`park-system park-system--${park.system}`}>
            {systemLabel(park.system)}
          </p>
          <h1 className="page-title">{park.name}</h1>
          <div className="park-meta-row">
            <p className="park-location">{park.locationLabel}</p>
            <a
              className="maps-link"
              href={mapsUrl(park.lat, park.lng, park.name)}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin {...iconDefaults} size={18} />
              Open in Maps
            </a>
          </div>

          <div className="stamp-stage">
            {visited ? (
              <>
                <div
                  className={`stamp-button is-stamped ${animating ? "is-animating" : ""}`}
                >
                  <Stamp
                    label={stampLabelForPark(park)}
                    date={visitedAt ? formatStampDate(visitedAt) : undefined}
                    tone={stampToneFromId(park.id)}
                    rotation={stampRotationFromId(park.id)}
                    size={168}
                  />
                  <span className="stamp-button__label">Stamped</span>
                </div>
                {visitedAt && !editingDate && (
                  <p className="stamp-date">{formatStampDate(visitedAt)}</p>
                )}
                {editingDate ? (
                  <div className="visit-date-edit">
                    <label className="visit-date-field">
                      <span className="visit-date-field__label">Visit date</span>
                      <input
                        type="date"
                        value={visitDate}
                        max={today}
                        onChange={(e) => setVisitDate(e.target.value)}
                      />
                    </label>
                    <div className="visit-date-edit__actions">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={onSaveDate}
                      >
                        Save date
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          setVisitDate(visitedAt ?? today);
                          setEditingDate(false);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="stamp-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setEditingDate(true)}
                    >
                      Edit date
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={onRemove}
                    >
                      Remove stamp
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  className={`stamp-button ${animating ? "is-animating" : ""}`}
                >
                  {animating ? (
                    <Stamp
                      label={stampLabelForPark(park)}
                      date={formatStampDate(visitDate)}
                      tone={stampToneFromId(park.id)}
                      rotation={stampRotationFromId(park.id)}
                      size={168}
                    />
                  ) : (
                    <span className="stamp-button__empty" aria-hidden />
                  )}
                </div>
                <label className="visit-date-field">
                  <span className="visit-date-field__label">Visit date</span>
                  <input
                    type="date"
                    value={visitDate}
                    max={today}
                    onChange={(e) => setVisitDate(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onStamp}
                >
                  Stamp this park
                </button>
              </>
            )}
          </div>

          <p className="park-page__back">
            <Link to={backTo}>
              <ArrowLeft {...iconDefaults} size={18} />
              Back to {backLabel}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
