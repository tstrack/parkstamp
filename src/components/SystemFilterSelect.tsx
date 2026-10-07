import type { SystemFilter } from "../types";

type Props = {
  value: SystemFilter;
  onChange: (value: SystemFilter) => void;
};

const OPTIONS: { value: SystemFilter; label: string }[] = [
  { value: "all", label: "All parks" },
  { value: "state", label: "State parks" },
  { value: "national", label: "National parks" },
];

export function SystemFilterSelect({ value, onChange }: Props) {
  return (
    <label className="system-select">
      <span className="visually-hidden">Park type</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SystemFilter)}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
