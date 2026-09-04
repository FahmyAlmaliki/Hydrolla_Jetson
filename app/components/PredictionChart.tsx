"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { AIPredictionChartPoint } from "@/app/lib/mockData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 border border-[var(--color-outline-variant)] rounded-xl shadow-lg px-3 py-2 text-xs max-w-[200px]">
      <p className="font-medium text-[var(--color-on-surface-variant)] mb-1.5">t-{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-2 font-mono" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function PredictionChart({ data }: { data: AIPredictionChartPoint[] }) {
  const chartData = data.map((d, i) => ({ ...d, time: `${i}` }));

  return (
    <article className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/40 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">
            Tren Prediksi vs Aktual
          </h3>
          <p className="text-xs text-[var(--color-outline)]">
            20 siklus inferensi terakhir
          </p>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "var(--color-outline)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--color-outline)" }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }}
              iconType="plainline"
            />

            {/* Suhu */}
            <Line
              name="Suhu Aktual"
              type="monotone"
              dataKey="actualSuhu"
              stroke="#e63946"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#e63946", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Line
              name="Suhu Prediksi"
              type="monotone"
              dataKey="predSuhu"
              stroke="#e63946"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={{ r: 2, fill: "#e63946", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />

            {/* pH */}
            <Line
              name="pH Aktual"
              type="monotone"
              dataKey="actualPh"
              stroke="#457b9d"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#457b9d", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Line
              name="pH Prediksi"
              type="monotone"
              dataKey="predPh"
              stroke="#457b9d"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={{ r: 2, fill: "#457b9d", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />

            {/* DO */}
            <Line
              name="DO Aktual"
              type="monotone"
              dataKey="actualDo"
              stroke="#2a9d8f"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "#2a9d8f", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Line
              name="DO Prediksi"
              type="monotone"
              dataKey="predDo"
              stroke="#2a9d8f"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={{ r: 2, fill: "#2a9d8f", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
