import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyResolvedTheme,
  readThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
  THEME_STORAGE_KEY,
} from "../lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    typeof window === "undefined" ? "system" : readThemePreference(),
  );
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    typeof window === "undefined" ? "light" : resolveTheme(readThemePreference()),
  );

  useEffect(() => {
    const next = resolveTheme(preference);
    setResolved(next);
    applyResolvedTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      /* private mode */
    }
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = resolveTheme("system");
      setResolved(next);
      applyResolvedTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
