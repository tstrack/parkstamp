import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import type { StateIndexEntry } from "../types";
import { iconDefaults } from "./icons";

type Props = {
  states: StateIndexEntry[];
  open: boolean;
  onToggle: () => void;
  onSelect: (code: string) => void;
};

export function StatePicker({ states, open, onToggle, onSelect }: Props) {
  const panelId = "browse-states-panel";

  const sorted = useMemo(
    () => [...states].sort((a, b) => a.name.localeCompare(b.name)),
    [states],
  );

  return (
    <section className={`browse-states${open ? " browse-states--open" : ""}`}>
      <button
        type="button"
        className="browse-states__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>Browse all states</span>
        <ChevronDown {...iconDefaults} className="browse-states__caret" />
      </button>

      {open && (
        <ul
          id={panelId}
          className="passport-list browse-states__list"
          role="region"
          aria-label="All states"
        >
          {sorted.map((s) => (
            <li key={s.code}>
              <button
                type="button"
                className="passport-row"
                onClick={() => onSelect(s.code.toLowerCase())}
              >
                <span className="passport-row__body">
                  <span className="passport-row__name">{s.name}</span>
                  <span className="passport-row__meta">
                    {s.parkCount} parks
                  </span>
                </span>
                <ChevronRight
                  {...iconDefaults}
                  className="passport-row__chevron"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
