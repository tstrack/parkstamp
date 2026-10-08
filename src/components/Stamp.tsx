import { useId, type CSSProperties } from "react";
import type { StampTone } from "../lib/stamp";

type StampProps = {
  label: string;
  date?: string;
  tone?: StampTone;
  rotation?: number;
  size?: number;
  className?: string;
};

/** Shared SVG noise filter — render once near the app root. */
export function StampFilters() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
      <filter id="stamp-rough">
        <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="4" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -.9"
        />
        <feComposite in="SourceGraphic" operator="in" />
      </filter>
    </svg>
  );
}

export function Stamp({
  label,
  date,
  tone = "rust",
  rotation = 0,
  size = 112,
  className = "",
}: StampProps) {
  const pathId = `stamp-${useId().replace(/:/g, "")}`;
  return (
    <svg
      className={`stamp stamp--${tone} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{ "--stamp-rot": `${rotation}deg` } as CSSProperties}
      role="img"
      aria-label={`${label} stamp`}
    >
      <defs>
        <path
          id={pathId}
          d="M60,60m-42,0a42,42 0 1,1 84,0a42,42 0 1,1-84,0"
        />
      </defs>
      <g fill="none" stroke="currentColor" filter="url(#stamp-rough)">
        <circle cx="60" cy="60" r="57" strokeWidth="3" />
        <circle cx="60" cy="60" r="52" strokeWidth="1" />
        <circle cx="60" cy="60" r="32" strokeWidth="1.5" />
        <path
          fill="currentColor"
          stroke="none"
          d="M60 40l-10 17h5l-8 12h26l-8-12h5z"
        />
        <g
          fill="currentColor"
          stroke="none"
          fontWeight="700"
          fontFamily="var(--font-display)"
        >
          <text fontSize="10">
            <textPath
              href={`#${pathId}`}
              textLength="255"
              lengthAdjust="spacing"
            >
              {label}
            </textPath>
          </text>
          {date && (
            <text x="60" y="84" fontSize="6.25" textAnchor="middle">
              {date}
            </text>
          )}
        </g>
      </g>
    </svg>
  );
}

type StampBadgeProps = {
  tone?: StampTone;
  size?: number;
  className?: string;
  "aria-label"?: string;
};

/** Compact 52px double-ring + pine for list rows. */
export function StampBadge({
  tone = "rust",
  size = 52,
  className = "",
  "aria-label": ariaLabel = "Visited",
}: StampBadgeProps) {
  return (
    <svg
      className={`stamp-badge-icon stamp--${tone} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={ariaLabel}
    >
      <g fill="none" stroke="currentColor" filter="url(#stamp-rough)">
        <circle cx="60" cy="60" r="54" strokeWidth="4" />
        <circle cx="60" cy="60" r="42" strokeWidth="2" />
        <path
          fill="currentColor"
          stroke="none"
          d="M60 38l-12 20h6l-10 16h32l-10-16h6z"
        />
      </g>
    </svg>
  );
}
