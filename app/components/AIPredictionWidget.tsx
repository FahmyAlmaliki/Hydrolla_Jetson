"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { mockAIPrediction } from "@/app/lib/mockData";

const TREND_CONFIG = {
  MENURUN: {
    label: "Tren Menurun",
    labelShort: "Menurun",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 6 9 9 4-4 6.364 6.364M21 16h-5.25v5.25" />
      </svg>
    ),
    textCls: "text-[var(--color-on-secondary-container)]",
    bgCls:   "bg-[var(--color-secondary)]/10",
    lineColor: "#006c49",
    areaColor: "#006c49",
  },
  NAIK: {
    label: "Tren Naik",
    labelShort: "Naik",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 18 9-9 4 4L21.75 6M16.5 6h5.25v5.25" />
      </svg>
    ),
    textCls: "text-[var(--color-error)]",
    bgCls:   "bg-[var(--color-error-container)]/30",
    lineColor: "#ba1a1a",
    areaColor: "#ba1a1a",
  },
  STABIL: {
    label: "Stabil",
    labelShort: "Stabil",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
    ),
    textCls: "text-[var(--color-primary)]",
    bgCls:   "bg-[var(--color-primary)]/10",
    lineColor: "#006591",
    areaColor: "#006591",
  },
} as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 border border-[var(--color-outline-variant)] rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-medium text-[var(--color-on-surface-variant)] mb-1">{label}</p>
      <p className="font-bold font-mono" style={{ color: payload[0].color }}>
        {payload[0].value.toFixed(3)} mg/L
      </p>
    </div>
  );
};

export default function AIPredictionWidget() {
  const ai = mockAIPrediction;
  const cfg = TREND_CONFIG[ai.trend];
  const threshold = 0.05;
  const willBreach = ai.forecast.some((p) => p.value >= threshold);

  return (
    <article className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/40 p-6 flex flex-col gap-5 animate-slide-up animation-delay-400">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">Prediksi AI (LSTM)</h3>
          <p className="text-xs text-[var(--color-outline)]">Proyeksi {ai.horizon}</p>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--color-on-surface-variant)] mb-1.5">
            Amonia (NH3) · 48 Jam ke Depan
          </p>
          <div className={["inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-sm", cfg.bgCls, cfg.textCls].join(" ")}>
            {cfg.icon}
            {cfg.label}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-[var(--color-outline)] mb-1">Akurasi Model</p>
          <p className="text-2xl font-bold tabular-nums text-[var(--color-on-surface)]">
            {ai.confidence}
            <span className="text-sm font-medium text-[var(--color-outline)] ml-0.5">%</span>
          </p>
        </div>
      </div>

      {/* Forecast mini chart */}
      <div className="w-full h-28 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ai.forecast} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={cfg.areaColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={cfg.areaColor} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--color-outline)" }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 0.07]} tick={{ fontSize: 9, fill: "var(--color-outline)" }} tickLine={false} axisLine={false} tickCount={4} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={threshold} stroke="#d88a00" strokeDasharray="4 2" strokeWidth={1.5} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={cfg.lineColor}
              strokeWidth={2}
              fill="url(#aiGrad)"
              dot={{ r: 3, fill: cfg.lineColor, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: cfg.lineColor, fill: "white" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Breach warning */}
      {willBreach && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-error-container)]/30 text-[var(--color-on-error-container)]">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-medium">Prediksi menyentuh ambang batas kritis (≥ 0.05 mg/L)</p>
        </div>
      )}

      {/* No breach */}
      {!willBreach && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-secondary)]/8 text-[var(--color-on-secondary-container)]">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
          </svg>
          <p className="text-xs font-medium">Tidak ada prediksi bahaya dalam 48 jam ke depan</p>
        </div>
      )}
    </article>
  );
}
