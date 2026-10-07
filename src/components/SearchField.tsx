type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
};

export function SearchField({ value, onChange, placeholder, label }: Props) {
  return (
    <label className="search-field">
      <span className="visually-hidden">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </label>
  );
}
