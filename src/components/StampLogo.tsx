type Props = {
  size?: number;
  variant?: "ink" | "stamp" | "outline";
  className?: string;
  stamped?: boolean;
};

export function StampLogo({
  size = 96,
  variant = "ink",
  className = "",
  stamped = false,
}: Props) {
  const stroke =
    variant === "stamp" || stamped
      ? "var(--stamp)"
      : variant === "outline"
        ? "var(--rule)"
        : "var(--ink)";
  const fill =
    variant === "outline" && !stamped
      ? "transparent"
      : variant === "stamp" || stamped
        ? "var(--stamp)"
        : "var(--ink)";

  return (
    <svg
      className={`stamp-logo ${stamped ? "stamp-logo--pressed" : ""} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 128 128"
      aria-hidden="true"
    >
      <circle
        cx="64"
        cy="64"
        r="58"
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        opacity={variant === "outline" && !stamped ? 0.55 : 1}
      />
      <circle
        cx="64"
        cy="64"
        r="50"
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        strokeDasharray="3 3"
        opacity={0.7}
      />
      <path
        d="M64 30 L69 48 H88 L73 59 L78 78 L64 67 L50 78 L55 59 L40 48 H59 Z"
        fill={fill}
        opacity={variant === "outline" && !stamped ? 0.25 : 0.95}
      />
      <path
        d="M50 84 C54 77, 74 77, 78 84 L76 96 H52 Z"
        fill={stamped || variant === "stamp" ? "var(--forest)" : "var(--forest)"}
        opacity={variant === "outline" && !stamped ? 0.2 : 0.9}
      />
    </svg>
  );
}
