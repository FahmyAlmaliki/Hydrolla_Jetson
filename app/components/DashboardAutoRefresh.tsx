"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/app/components/MetricCard";
import WaterChart from "@/app/components/WaterChart";
import AIPredictionWidget from "@/app/components/AIPredictionWidget";
import AlertTable from "@/app/components/AlertTable";
import type { DashboardData } from "@/app/lib/dataService";

const REFRESH_MS = 10_000;

export default function DashboardAutoRefresh({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        setRefreshing(true);
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const nextData = (await response.json()) as DashboardData;
        if (!cancelled) {
          setData(nextData);
          setLastUpdated(new Date().toISOString());
        }
      } catch {
        // Keep the last good data on screen if refresh fails.
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    }

    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-fade-in flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)] leading-tight">
            Dashboard Real-Time
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Pemantauan kualitas air kolam akuaponik secara langsung
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span
            title={
              data.dataSource === "influxdb"
                ? "Terhubung ke InfluxDB"
                : "Mode demo — InfluxDB belum dikonfigurasi"
            }
            className={[
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start",
              data.dataSource === "influxdb"
                ? "bg-[var(--color-secondary)]/10 text-[var(--color-on-secondary-container)]"
                : "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]",
            ].join(" ")}
          >
            <span
              className={[
                "w-1.5 h-1.5 rounded-full",
                data.dataSource === "influxdb"
                  ? "bg-[var(--color-secondary)] animate-pulse-dot"
                  : "bg-[var(--color-outline)]",
              ].join(" ")}
            />
            {data.dataSource === "influxdb" ? "Live · InfluxDB" : "Demo · Mock Data"}
          </span>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
            <span className={[
              "w-1.5 h-1.5 rounded-full",
              refreshing ? "bg-[var(--color-secondary)] animate-pulse-dot" : "bg-[var(--color-outline)]",
            ].join(" ")} />
            {refreshing ? "Menyegarkan..." : "Auto refresh aktif"}
          </span>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
            Update: {new Date(lastUpdated).toLocaleTimeString("id-ID")}
          </span>
        </div>
      </div>

      <section aria-label="Ringkasan Sensor">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.sensors.map((sensor, i) => (
            <MetricCard key={sensor.parameter} data={sensor} delay={i * 80} />
          ))}
        </div>
      </section>

      <WaterChart data={data.chart} />

      <section aria-label="Prediksi AI dan Peringatan" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <AIPredictionWidget />
        </div>
        <div className="lg:col-span-3">
          <AlertTable alerts={data.alerts} />
        </div>
      </section>
    </div>
  );
}