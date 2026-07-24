"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { ChartPoint } from "@/app/lib/mockData";
import type { ChartRange } from "@/app/lib/dataService";

type Filter = "Semua" | "pH" | "DO" | "Suhu";

const SERIES_CONFIG = {
  pH:   { color: "#006591", label: "pH",           yAxisId: "left"  },
  DO:   { color: "#006c49", label: "DO (mg/L)",    yAxisId: "left"  },
  suhu: { color: "#d88a00", label: "Suhu (°C)",    yAxisId: "right" },
} as const;


const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-[var(--color-outline-variant)] rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-[var(--color-on-surface)] mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-6 mb-1">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="font-mono font-semibold text-[var(--color-on-surface)]">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function WaterChart({
  data,
  range,
  onRangeChange,
}: {
  data: ChartPoint[];
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
}) {
  const [filter, setFilter] = useState<Filter>("Semua");

  const filters: Filter[] = ["Semua", "pH", "DO", "Suhu"];
  const show = (key: Filter) => filter === "Semua" || filter === key;
  const rangeOptions: Array<{ value: ChartRange; label: string }> = [
    { value: "30m", label: "30 Mnt" },
    { value: "1h",  label: "1 Jam" },
    { value: "6h",  label: "6 Jam" },
    { value: "24h", label: "24 Jam" },
    { value: "7d",  label: "7 Hari" },
    { value: "30d", label: "30 Hari" },
  ];

  return (
    <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/40 p-4 sm:p-6 animate-slide-up animation-delay-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="shrink-0">
          <h3 className="text-base font-semibold text-[var(--color-on-surface)]">
            Fluktuasi Parameter Air
          </h3>
          <p className="text-xs text-[var(--color-outline)] mt-0.5">Rentang aktif: {range}</p>
        </div>

        {/* Filter controls — scrollable on small screens */}
        <div className="flex flex-col xs:flex-row gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface-container)] shrink-0">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onRangeChange(option.value)}
                className={[
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                  range === option.value
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface-container)] shrink-0">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                  filter === f
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-56 sm:h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#006591" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#006591" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" strokeOpacity={0.4} vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "var(--color-outline)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-outline-variant)", strokeOpacity: 0.5 }}
              interval={3}
            />

            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: "var(--color-outline)" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: "var(--color-outline)" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", color: "var(--color-on-surface-variant)", paddingTop: "12px" }}
            />

            {/* Critical reference lines */}
            {(filter === "Semua" || filter === "pH") && (
              <>
                <ReferenceLine yAxisId="left" y={6.5} stroke="#d88a00" strokeDasharray="4 2" strokeOpacity={0.6} />
                <ReferenceLine yAxisId="left" y={8.5} stroke="#d88a00" strokeDasharray="4 2" strokeOpacity={0.6} />
              </>
            )}

            {show("pH") && (
              <Line yAxisId="left"  type="monotone" dataKey="pH"   name="pH"          stroke={SERIES_CONFIG.pH.color}   strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
            )}
            {show("DO") && (
              <Line yAxisId="left"  type="monotone" dataKey="DO"   name="DO (mg/L)"   stroke={SERIES_CONFIG.DO.color}   strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
            )}
            {show("Suhu") && (
              <Line yAxisId="right" type="monotone" dataKey="suhu" name="Suhu (°C)"   stroke={SERIES_CONFIG.suhu.color} strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.length < 2 && (
        <p className="mt-3 text-xs text-[var(--color-outline)]">
          Menunggu data sensor berikutnya… Grafik akan terbentuk setelah ada minimal 2 pembacaan.
        </p>
      )}
    </section>
  );
}
