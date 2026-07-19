"use client";

import { useEffect, useRef, useState } from "react";
import MetricCard from "@/app/components/MetricCard";
import WaterChart from "@/app/components/WaterChart";
import AIPredictionWidget from "@/app/components/AIPredictionWidget";
import AlertTable from "@/app/components/AlertTable";
import type { ChartRange, DashboardData } from "@/app/lib/dataService";
import type { ChartPoint } from "@/app/lib/mockData";

const REFRESH_MS = 10_000;
const DEFAULT_RANGE: ChartRange = "24h";
/** Jumlah maksimum titik yang ditampilkan di grafik live */
const MAX_LIVE_POINTS = 60;

/** Format jam:menit untuk label sumbu X */
function nowLabel(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

/** Buat satu ChartPoint dari data sensors terbaru */
function sensorToPoint(sensors: DashboardData["sensors"]): ChartPoint {
  const get = (param: string) => sensors.find((s) => s.parameter === param)?.value ?? 0;
  return {
    time: nowLabel(),
    pH:   get("pH"),
    DO:   get("DO"),
    suhu: get("Suhu"),
    NH3:  get("NH3"),
  };
}

export default function DashboardAutoRefresh({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [chartRange, setChartRange] = useState<ChartRange>(DEFAULT_RANGE);

  /**
   * livePoints: titik-titik yang ditampilkan di grafik.
   * Diinisialisasi dari sensor awal sebagai satu titik flat,
   * lalu bertambah setiap kali refresh berhasil.
   */
  const [livePoints, setLivePoints] = useState<ChartPoint[]>(() => [
    sensorToPoint(initialData.sensors),
  ]);

  /**
   * Ref agar closure refresh() selalu baca nilai livePoints terbaru
   * tanpa perlu dimasukkan ke dependency array (yang akan reset interval).
   */
  const livePointsRef = useRef(livePoints);
  livePointsRef.current = livePoints;

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

          // Tambahkan titik baru dari nilai sensor terkini
          const newPoint = sensorToPoint(nextData.sensors);
          setLivePoints((prev) => {
            const updated = [...prev, newPoint];
            // Batasi panjang agar chart tidak terus melebar
            return updated.length > MAX_LIVE_POINTS
              ? updated.slice(updated.length - MAX_LIVE_POINTS)
              : updated;
          });
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
    // Reset live points ke titik tunggal dari nilai sensor saat ini
    // supaya grafik mulai ulang dari nilai real, bukan lompat ke mock historis
    setLivePoints([sensorToPoint(data.sensors)]);
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
                : "Mode demo — InfluxDB belum dikonfigurasi"
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
            {data.dataSource === "influxdb" ? "Live · InfluxDB" : "Demo · Mock"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.sensors.map((sensor, i) => (
            <MetricCard key={sensor.parameter} data={sensor} delay={i * 80} />
          ))}
        </div>
      </section>

      <WaterChart
        data={livePoints}
        range={chartRange}
        onRangeChange={handleRangeChange}
      />

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