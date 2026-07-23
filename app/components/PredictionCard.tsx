"use client";

import { AnomalyStatus, getAnomalyLabel } from "@/app/lib/mockData";

const ANOMALY_CONFIG: Record<
  AnomalyStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  OK: {
    bg: "bg-[var(--color-secondary)]/8",
    text: "text-[var(--color-on-secondary-container)]",
    border: "border-[var(--color-secondary-container)]/40",
    dot: "bg-[var(--color-secondary)]",
  },
  ANOMALI: {
    bg: "bg-[var(--color-error-container)]/30",
    text: "text-[var(--color-on-error-container)]",
    border: "border-[var(--color-error)]/40",
    dot: "bg-[var(--color-error)]",
  },
};

interface PredictionCardProps {
  label: string;
  unit: string;
  currentValue: number;
  predictedValue: number;
  offset: number;
  accuracy: number;
  status: AnomalyStatus;
  icon: React.ReactNode;
  delay?: number;
}

function OffsetBadge({ offset }: { offset: number }) {
  const isUp = offset > 0;
  const isDown = offset < 0;
  const color = isUp
    ? "text-[var(--color-error)]"
    : isDown
      ? "text-[var(--color-secondary)]"
      : "text-[var(--color-outline)]";

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      {isUp ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      ) : isDown ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : null}
      {offset > 0 ? "+" : ""}{offset.toFixed(2)}
    </span>
  );
}

export default function PredictionCard({
  label,
  unit,
  currentValue,
  predictedValue,
  offset,
  accuracy,
  status,
  icon,
  delay = 0,
}: PredictionCardProps) {
  const cfg = ANOMALY_CONFIG[status];

  const diffPercent =
    currentValue !== 0
      ? Math.abs(((predictedValue - currentValue) / currentValue) * 100)
      : 0;

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
              {icon}
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
              {label}
            </h3>
          </div>

          <span className={[
            "shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
            cfg.bg, cfg.text,
          ].join(" ")}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {getAnomalyLabel(status)}
          </span>
        </div>

        {/* Current vs Predicted */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-medium text-[var(--color-outline)] uppercase tracking-wider mb-1">
              Aktual
            </p>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-on-surface)]">
              {currentValue.toFixed(unit === "°C" ? 1 : 2)}
              <span className="text-xs font-medium text-[var(--color-outline)] ml-0.5">{unit}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-[var(--color-outline)] uppercase tracking-wider mb-1">
              Prediksi
            </p>
            <p className="text-2xl font-bold tabular-nums text-[var(--color-primary)]">
              {predictedValue.toFixed(unit === "°C" ? 1 : 2)}
              <span className="text-xs font-medium text-[var(--color-outline)] ml-0.5">{unit}</span>
            </p>
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--color-outline-variant)]/30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--color-outline)]">Offset:</span>
            <OffsetBadge offset={offset} />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[var(--color-outline)]">Akurasi:</span>
            <span className="font-bold tabular-nums text-[var(--color-on-surface)]">
              {accuracy.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Accuracy bar */}
      <div className="h-1 w-full bg-[var(--color-surface-container)]">
        <div
          className="h-full transition-all duration-500 ease-out rounded-r-full"
          style={{
            width: `${Math.min(accuracy, 100)}%`,
            backgroundColor:
              accuracy >= 90
                ? "var(--color-secondary)"
                : accuracy >= 70
                  ? "var(--color-tertiary)"
                  : "var(--color-error)",
          }}
        />
      </div>
    </article>
  );
}
