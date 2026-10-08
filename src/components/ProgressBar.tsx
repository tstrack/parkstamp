type Props = {
  value: number;
  max: number;
  className?: string;
  label?: string;
};

export function ProgressBar({ value, max, className = "", label }: Props) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={`progress-bar ${className}`.trim()}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ?? `${value} of ${max}`}
    >
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
