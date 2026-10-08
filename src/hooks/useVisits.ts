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
  getAllVisits,
  getVisit,
  stampVisit,
  toggleVisit,
  unstampVisit,
  updateVisitDate,
} from "../lib/visits";
import type { Visit } from "../types";

type VisitsContextValue = {
  visits: Map<string, Visit>;
  ready: boolean;
  isVisited: (parkId: string) => boolean;
  getVisitedAt: (parkId: string) => string | undefined;
  getStampedAt: (parkId: string) => string | undefined;
  stamp: (parkId: string, visitDate?: string) => Promise<void>;
  updateDate: (parkId: string, visitDate: string) => Promise<void>;
  unstamp: (parkId: string) => Promise<void>;
  toggle: (parkId: string, visitDate?: string) => Promise<void>;
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

  const getStampedAt = useCallback(
    (parkId: string) => visits.get(parkId)?.stampedAt,
    [visits],
  );

  const stamp = useCallback(async (parkId: string, visitDate?: string) => {
    const next = await stampVisit(parkId, visitDate);
    setVisits((prev) => {
      const copy = new Map(prev);
      copy.set(parkId, next);
      return copy;
    });
  }, []);

  const updateDate = useCallback(async (parkId: string, visitDate: string) => {
    const next = await updateVisitDate(parkId, visitDate);
    if (!next) return;
    setVisits((prev) => {
      const copy = new Map(prev);
      copy.set(parkId, next);
      return copy;
    });
  }, []);

  const unstamp = useCallback(async (parkId: string) => {
    await unstampVisit(parkId);
    setVisits((prev) => {
      const copy = new Map(prev);
      copy.delete(parkId);
      return copy;
    });
  }, []);

  const toggle = useCallback(async (parkId: string, visitDate?: string) => {
    const existing = await getVisit(parkId);
    const next = await toggleVisit(parkId, Boolean(existing), visitDate);
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
      getStampedAt,
      stamp,
      updateDate,
      unstamp,
      toggle,
      visitedCount: visits.size,
    }),
    [
      visits,
      ready,
      isVisited,
      getVisitedAt,
      getStampedAt,
      stamp,
      updateDate,
      unstamp,
      toggle,
    ],
  );

  return createElement(VisitsContext.Provider, { value }, children);
}

export function useVisits(): VisitsContextValue {
  const ctx = useContext(VisitsContext);
  if (!ctx) throw new Error("useVisits must be used within VisitsProvider");
  return ctx;
}
