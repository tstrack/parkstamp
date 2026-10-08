import { useEffect, useId, useRef } from "react";
import { Monitor, Moon, Sun, X } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import type { ThemePreference } from "../lib/theme";
import { iconDefaults } from "./icons";

type Props = {
  open: boolean;
  onClose: () => void;
};

const OPTIONS: {
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function SettingsSheet({ open, onClose }: Props) {
  const { preference, setPreference } = useTheme();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-sheet" role="presentation">
      <button
        type="button"
        className="settings-sheet__backdrop"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div
        className="settings-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="settings-sheet__header">
          <h2 id={titleId} className="settings-sheet__title">
            Settings
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="settings-sheet__close"
            aria-label="Close settings"
            onClick={onClose}
          >
            <X {...iconDefaults} size={22} />
          </button>
        </div>

        <section className="settings-sheet__section" aria-labelledby="appearance-label">
          <h3 id="appearance-label" className="settings-sheet__label">
            Appearance
          </h3>
          <div className="theme-toggle" role="radiogroup" aria-labelledby="appearance-label">
            {OPTIONS.map(({ value, label, Icon }) => {
              const selected = preference === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`theme-toggle__option${selected ? " theme-toggle__option--active" : ""}`}
                  onClick={() => setPreference(value)}
                >
                  <Icon {...iconDefaults} size={18} />
                  {label}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
