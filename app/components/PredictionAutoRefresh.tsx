"use client";

import { useEffect, useState } from "react";
import AIPredictionWidget from "@/app/components/AIPredictionWidget";
import type { DashboardData } from "@/app/lib/dataService";

const REFRESH_MS = 10_000;

export default function PredictionAutoRefresh({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        setRefreshing(true);
        const response = await fetch(`/api/dashboard`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const nextData = (await response.json()) as DashboardData;
        if (!cancelled) {
          setData(nextData);
        }
      } catch {
        // Abaikan error untuk mempertahankan tampilan terakhir jika jaringan bermasalah
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    // Jalankan timer auto refresh setiap REFRESH_MS
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <AIPredictionWidget data={data.aiPrediction} chart={data.aiChart} loading={refreshing} />
  );
}
