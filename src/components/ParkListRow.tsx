import { CircleCheck } from "lucide-react";
import { formatVisitMonth } from "../lib/stamp";
import { systemLabel } from "../lib/systemFilter";
import type { Park } from "../types";
import { iconDefaults } from "./icons";

type Props = {
  park: Park;
  visited: boolean;
  visitedAt?: string;
  highlighted?: boolean;
  showState?: boolean;
  onClick: () => void;
  rowRef?: (el: HTMLButtonElement | null) => void;
};

export function ParkListRow({
  park,
  visited,
  visitedAt,
  highlighted = false,
  showState = false,
  onClick,
  rowRef,
}: Props) {
  const meta = showState
    ? `${systemLabel(park.system)} · ${park.state}`
    : `${systemLabel(park.system)} · ${park.locationLabel}`;

  return (
    <button
      ref={rowRef}
      type="button"
      className={`passport-row park-row ${visited ? "park-row--visited" : ""} park-row--${park.system}${highlighted ? " park-row--highlight" : ""}`}
      onClick={onClick}
    >
      <span className="park-row__body">
        <span className="passport-row__name">{park.name}</span>
        <span className="passport-row__meta">
          {visited && visitedAt
            ? `${formatVisitMonth(visitedAt)}${showState ? ` · ${park.state}` : ""}`
            : meta}
        </span>
      </span>
      {visited && <CircleCheck {...iconDefaults} className="park-row__check" />}
    </button>
  );
}
