import MetricCard          from "@/app/components/MetricCard";
import WaterChart           from "@/app/components/WaterChart";
import AIPredictionWidget   from "@/app/components/AIPredictionWidget";
import AlertTable           from "@/app/components/AlertTable";
import { getDashboardData } from "@/app/lib/dataService";

// Refresh data setiap 10 detik (Next.js ISR / revalidate)
export const revalidate = 10;

export default async function DashboardPage() {
  const { sensors, chart, alerts, dataSource } = await getDashboardData();

  return (
    <div className="flex flex-col gap-8">

      {/* ── Section header ── */}
      <div className="animate-fade-in flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-on-surface)] leading-tight">
            Dashboard Real-Time
          </h1>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Pemantauan kualitas air kolam akuaponik secara langsung
          </p>
        </div>

        {/* Data source badge */}
        <span
          title={
            dataSource === "influxdb"
              ? "Terhubung ke InfluxDB"
              : "Mode demo — InfluxDB belum dikonfigurasi"
          }
          className={[
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold self-start mt-1",
            dataSource === "influxdb"
              ? "bg-[var(--color-secondary)]/10 text-[var(--color-on-secondary-container)]"
              : "bg-[var(--color-surface-container-high)] text-[var(--color-outline)]",
          ].join(" ")}
        >
          <span
            className={[
              "w-1.5 h-1.5 rounded-full",
              dataSource === "influxdb"
                ? "bg-[var(--color-secondary)] animate-pulse-dot"
                : "bg-[var(--color-outline)]",
            ].join(" ")}
          />
          {dataSource === "influxdb" ? "Live · InfluxDB" : "Demo · Mock Data"}
        </span>
      </div>

      {/* ── Metric Cards ── */}
      <section aria-label="Ringkasan Sensor">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sensors.map((sensor, i) => (
            <MetricCard key={sensor.parameter} data={sensor} delay={i * 80} />
          ))}
        </div>
      </section>

      {/* ── Main Chart ── */}
      <WaterChart data={chart} />

      {/* ── Bottom Row: AI + Alerts ── */}
      <section aria-label="Prediksi AI dan Peringatan" className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <AIPredictionWidget />
        </div>
        <div className="lg:col-span-3">
          <AlertTable alerts={alerts} />
        </div>
      </section>

    </div>
  );
}
