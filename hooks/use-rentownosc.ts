"use client";

import { useState, useEffect, useCallback } from "react";
import { getProjectProfitability, type ProfitabilityData } from "@/app/dashboard/projects/[id]/profitability-actions";

interface UseRentownoscReturn {
  data: ProfitabilityData | null;
  loading: boolean;
  refresh: () => void;
}

export function useRentownosc(projectId: string): UseRentownoscReturn {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getProjectProfitability(projectId).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refresh: load };
}
