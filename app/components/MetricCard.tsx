"use client";

import { SensorReading, StatusLevel } from "@/app/lib/mockData";

const STATUS_CONFIG: Record<
  StatusLevel,
  { label: string; bg: string; text: string; border: string; dot: string; valueCls: string }
> = {
  BAIK: {
    label: "Baik",
    bg: "bg-[var(--color-secondary)]/8",
    text: "text-[var(--color-on-secondary-container)]",
    border: "border-[var(--color-secondary-container)]/40",
    dot: "bg-[var(--color-secondary)]",
    valueCls: "text-[var(--color-on-surface)]",
  },
  WASPADA: {
    label: "Waspada",
    bg: "bg-[var(--color-tertiary-container)]/15",
    text: "text-[var(--color-on-tertiary-container)]",
    border: "border-[var(--color-tertiary-container)]/40",
    dot: "bg-[var(--color-tertiary)]",
    valueCls: "text-[var(--color-tertiary)]",
  },
  KRITIS: {
    label: "Kritis",
    bg: "bg-[var(--color-error-container)]/30",
    text: "text-[var(--color-on-error-container)]",
    border: "border-[var(--color-error)]/40",
    dot: "bg-[var(--color-error)]",
    valueCls: "text-[var(--color-error)]",
  },
};

const PARAM_ICONS: Record<SensorReading["parameter"], React.ReactNode> = {
  pH: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.428 15.428a2 2 0 0 0-1.022-.547l-2.387-.477a6 6 0 0 0-3.86.517l-.318.158a6 6 0 0 1-3.86.517L6.05 15.21a2 2 0 0 0-1.806.547M8 4h8l-1 1v5.172a2 2 0 0 0 .586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 0 0 9 10.172V5L8 4Z" />
    </svg>
  ),
  DO: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  ),
  Suhu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
    </svg>
  ),
};

const PARAM_LABELS: Record<SensorReading["parameter"], string> = {
  Suhu: "Suhu",
  pH: "pH",
  DO: "DO (Oksigen)",
};

/** Mini sparkline used in the "history" column */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 100;
  const H = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4);
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `0,${H} ${polyline} ${W},${H}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-8">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

const SPARKLINE_COLORS: Record<StatusLevel, string> = {
  BAIK:    "#006c49",
  WASPADA: "#d88a00",
  KRITIS:  "#ba1a1a",
};

export default function MetricCard({
  data,
  delay = 0,
}: {
  data: SensorReading;
  delay?: number;
}) {
  const cfg = STATUS_CONFIG[data.status];
  const sparkColor = SPARKLINE_COLORS[data.status];

  // Derive a "predicted" value by using the last history value (next reading estimate)
  // and a "trend" offset from history for display purposes
  const history = data.history;
  const lastVal = history[history.length - 1] ?? data.value;
  const prevVal = history[history.length - 2] ?? lastVal;
  const trend = lastVal - prevVal;
  const isTrendUp = trend > 0.001;
  const isTrendDown = trend < -0.001;
  const trendColor = isTrendUp
    ? "text-[var(--color-error)]"
    : isTrendDown
      ? "text-[var(--color-secondary)]"
      : "text-[var(--color-outline)]";

  // Format decimals based on unit
  const decimals = data.unit === "°C" ? 1 : data.unit === "mg/L" ? 2 : 2;

  return (
    <article
      className={[
        "animate-slide-up bg-[var(--color-surface-container-lowest)] rounded-2xl",
        "border overflow-hidden flex flex-col",
        "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ease-out",
        cfg.border,
      ].join(" ")}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="px-5 pt-5 pb-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
              {PARAM_ICONS[data.parameter]}
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
              {PARAM_LABELS[data.parameter]}
            </h3>
          </div>

          {/* Status badge */}
          <span className={[
            "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
            cfg.bg, cfg.text,
          ].join(" ")}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {/* Value row: current (big) + last history reading */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-medium text-[var(--color-outline)] uppercase tracking-wider mb-1">
              Terkini
            </p>
            <p className={["text-2xl font-bold tabular-nums", cfg.valueCls].join(" ")}>
              {data.value.toFixed(decimals)}
              <span className="text-xs font-medium text-[var(--color-outline)] ml-0.5">{data.unit}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-[var(--color-outline)] uppercase tracking-wider mb-1">
              Sebelumnya
            </p>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-on-surface-variant)]">
              {prevVal.toFixed(decimals)}
              <span className="text-xs font-medium text-[var(--color-outline)] ml-0.5">{data.unit}</span>
            </p>
          </div>
        </div>

        {/* Trend + ideal range */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--color-outline-variant)]/30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--color-outline)]">Tren:</span>
            <span className={`inline-flex items-center gap-0.5 font-semibold ${trendColor}`}>
              {isTrendUp ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : isTrendDown ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : null}
              {trend > 0 ? "+" : ""}{trend.toFixed(decimals)}
            </span>
          </div>
          <p className="text-xs text-[var(--color-outline)]">{data.idealLabel}</p>
        </div>
      </div>

      {/* Sparkline strip */}
      <div className="mt-auto">
        <Sparkline data={history} color={sparkColor} />
      </div>
    </article>
  );
}
