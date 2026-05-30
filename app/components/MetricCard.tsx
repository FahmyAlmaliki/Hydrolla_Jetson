"use client";

import { SensorReading, StatusLevel } from "@/app/lib/mockData";

const STATUS_CONFIG: Record<
  StatusLevel,
  { label: string; bg: string; text: string; border: string; valueCls: string }
> = {
  BAIK: {
    label: "Baik",
    bg: "bg-[var(--color-secondary)]/8",
    text: "text-[var(--color-on-secondary-container)]",
    border: "border-[var(--color-secondary-container)]/40",
    valueCls: "text-[var(--color-on-surface)]",
  },
  WASPADA: {
    label: "Waspada",
    bg: "bg-[var(--color-tertiary-container)]/15",
    text: "text-[var(--color-on-tertiary-container)]",
    border: "border-[var(--color-tertiary-container)]/40",
    valueCls: "text-[var(--color-tertiary)]",
  },
  KRITIS: {
    label: "Kritis",
    bg: "bg-[var(--color-error-container)]/30",
    text: "text-[var(--color-on-error-container)]",
    border: "border-[var(--color-error)]/40",
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
  NH3: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
};

const SPARKLINE_COLORS: Record<StatusLevel, string> = {
  BAIK:    "#006c49",
  WASPADA: "#d88a00",
  KRITIS:  "#ba1a1a",
};

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
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-9">
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

export default function MetricCard({
  data,
  delay = 0,
}: {
  data: SensorReading;
  delay?: number;
}) {
  const cfg = STATUS_CONFIG[data.status];
  const sparkColor = SPARKLINE_COLORS[data.status];

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
              {data.parameter === "NH3" ? "Amonia (NH3)" : data.parameter === "DO" ? "DO (Oksigen)" : data.parameter}
            </h3>
          </div>

          {/* Status badge */}
          <span className={[
            "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
            cfg.bg, cfg.text,
          ].join(" ")}>
            {data.status === "WASPADA" && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
            )}
            {data.status === "KRITIS" && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
              </svg>
            )}
            {cfg.label}
          </span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1.5">
          <span className={["text-4xl font-bold tabular-nums tracking-tight leading-none", cfg.valueCls].join(" ")}>
            {data.value}
          </span>
          {data.unit && (
            <span className="text-sm font-medium text-[var(--color-outline)]">{data.unit}</span>
          )}
        </div>

        {/* Ideal range */}
        <p className="text-xs text-[var(--color-outline)]">{data.idealLabel}</p>
      </div>

      {/* Sparkline strip */}
      <div className="mt-auto">
        <Sparkline data={data.history} color={sparkColor} />
      </div>
    </article>
  );
}
