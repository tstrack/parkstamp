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
import { getAllVisits, getVisit, toggleVisit } from "../lib/visits";
import type { Visit } from "../types";

type VisitsContextValue = {
  visits: Map<string, Visit>;
  ready: boolean;
  isVisited: (parkId: string) => boolean;
  getVisitedAt: (parkId: string) => string | undefined;
  toggle: (parkId: string) => Promise<void>;
  visitedCount: number;
};

const VisitsContext = createContext<VisitsContextValue | null>(null);

export function VisitsProvider({ children }: { children: ReactNode }) {
  const [visits, setVisits] = useState<Map<string, Visit>>(new Map());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllVisits().then((map) => {
      if (!cancelled) {
        setVisits(map);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isVisited = useCallback(
    (parkId: string) => visits.has(parkId),
    [visits],
  );

  const getVisitedAt = useCallback(
    (parkId: string) => visits.get(parkId)?.visitedAt,
    [visits],
  );

  const toggle = useCallback(async (parkId: string) => {
    const existing = await getVisit(parkId);
    const next = await toggleVisit(parkId, Boolean(existing));
    setVisits((prev) => {
      const copy = new Map(prev);
      if (next) copy.set(parkId, next);
      else copy.delete(parkId);
      return copy;
    });
  }, []);

  const value = useMemo(
    () => ({
      visits,
      ready,
      isVisited,
      getVisitedAt,
      toggle,
      visitedCount: visits.size,
    }),
    [visits, ready, isVisited, getVisitedAt, toggle],
  );

  return createElement(VisitsContext.Provider, { value }, children);
}

export function useVisits(): VisitsContextValue {
  const ctx = useContext(VisitsContext);
  if (!ctx) throw new Error("useVisits must be used within VisitsProvider");
  return ctx;
}
