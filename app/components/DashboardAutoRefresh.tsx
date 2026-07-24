"use client";

import { useEffect, useRef, useState } from "react";
import MetricCard from "@/app/components/MetricCard";
import WaterChart from "@/app/components/WaterChart";
import AIPredictionWidget from "@/app/components/AIPredictionWidget";
import type { ChartRange, DashboardData } from "@/app/lib/dataService";
import type { ChartPoint } from "@/app/lib/mockData";

const REFRESH_MS = 10_000;
const DEFAULT_RANGE: ChartRange = "24h";

export default function DashboardAutoRefresh({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [chartRange, setChartRange] = useState<ChartRange>(DEFAULT_RANGE);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        setRefreshing(true);
        const response = await fetch(`/api/dashboard?range=${chartRange}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const nextData = (await response.json()) as DashboardData;
        if (!cancelled) {
          setData(nextData);
          setLastUpdated(new Date().toISOString());
        }
      } catch {
        // Pertahankan data terakhir jika refresh gagal
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [chartRange]);

  function handleRangeChange(nextRange: ChartRange) {
    setChartRange(nextRange);
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)] leading-tight">
            Dashboard Real-Time
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Pemantauan kualitas air kolam akuaponik secara langsung
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            title={
              data.dataSource === "influxdb"
                ? "Terhubung ke InfluxDB"
                : "InfluxDB belum dikonfigurasi"
            }
            className={[
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
              data.dataSource === "influxdb"
                ? "bg-[var(--color-secondary)]/10 text-[var(--color-on-secondary-container)]"
                : "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]",
            ].join(" ")}
          >
            <span
              className={[
                "w-1.5 h-1.5 rounded-full shrink-0",
                data.dataSource === "influxdb"
                  ? "bg-[var(--color-secondary)] animate-pulse-dot"
                  : "bg-[var(--color-outline)]",
              ].join(" ")}
            />
            {data.dataSource === "influxdb" ? "Live · InfluxDB" : "Tidak Terhubung"}
          </span>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
            <span className={[
              "w-1.5 h-1.5 rounded-full shrink-0",
              refreshing ? "bg-[var(--color-secondary)] animate-pulse-dot" : "bg-[var(--color-outline)]",
            ].join(" ")} />
            {refreshing ? "Refresh..." : "Auto refresh"}
          </span>

          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
            Update: {new Date(lastUpdated).toLocaleTimeString("id-ID")}
          </span>
        </div>
      </div>

      <section aria-label="Ringkasan Sensor">
        {data.sensors.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-10 px-4 rounded-2xl border border-dashed border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)]/50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-[var(--color-outline)] shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">Menunggu data sensor...</p>
              <p className="text-xs text-[var(--color-outline)] mt-0.5">Belum ada pembacaan dari InfluxDB dalam 7 hari terakhir</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.sensors.map((sensor, i) => (
              <MetricCard key={sensor.parameter} data={sensor} delay={i * 80} />
            ))}
          </div>
        )}
      </section>

      <WaterChart
        data={data.chart}
        range={chartRange}
        onRangeChange={handleRangeChange}
      />

      <section aria-label="Prediksi AI dan Peringatan" className="flex flex-col gap-4">
        <AIPredictionWidget data={data.aiPrediction} chart={data.aiChart} loading={refreshing} />
      </section>
    </div>
  );
}