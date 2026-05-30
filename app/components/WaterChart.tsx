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

type Filter = "Semua" | "pH" | "DO" | "Suhu" | "NH3";

const SERIES_CONFIG = {
  pH:   { color: "#006591", label: "pH",           yAxisId: "left"  },
  DO:   { color: "#006c49", label: "DO (mg/L)",    yAxisId: "left"  },
  suhu: { color: "#d88a00", label: "Suhu (°C)",    yAxisId: "right" },
  NH3:  { color: "#ba1a1a", label: "NH3 (×10 mg/L)", yAxisId: "left" },
} as const;

// scale NH3 for visibility on the same axis as pH & DO
function transformPoint(p: ChartPoint) {
  return { ...p, NH3: p.NH3 * 10 };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur border border-[var(--color-outline-variant)] rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-[var(--color-on-surface)] mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-6 mb-1">
          <span style={{ color: entry.color }} className="font-medium">{entry.name}</span>
          <span className="font-mono font-semibold text-[var(--color-on-surface)]">
            {entry.dataKey === "NH3"
              ? (entry.value / 10).toFixed(3)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function WaterChart({ data }: { data: ChartPoint[] }) {
  const [filter, setFilter] = useState<Filter>("Semua");
  const transformed = data.map(transformPoint);

  const filters: Filter[] = ["Semua", "pH", "DO", "Suhu", "NH3"];
  const show = (key: Filter) => filter === "Semua" || filter === key;

  return (
    <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/40 p-6 animate-slide-up animation-delay-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-on-surface)]">
            Fluktuasi Parameter Air
          </h3>
          <p className="text-xs text-[var(--color-outline)] mt-0.5">24 Jam Terakhir</p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-surface-container)]">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
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

      {/* Chart */}
      <div className="w-full h-72 min-w-0">
        {data.length < 2 && (
          <div className="absolute hidden" />
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={transformed} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
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
            {show("NH3") && (
              <Line yAxisId="left"  type="monotone" dataKey="NH3"  name="NH3 (×10 mg/L)" stroke={SERIES_CONFIG.NH3.color}  strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} strokeDasharray="5 3" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.length < 2 && (
        <p className="mt-3 text-xs text-[var(--color-outline)]">
          Grafik masih punya {data.length} sampel. Line chart baru akan terbentuk saat ada minimal 2 data historis.
        </p>
      )}
    </section>
  );
}
