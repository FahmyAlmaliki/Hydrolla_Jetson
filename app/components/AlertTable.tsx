"use client";

import Link from "next/link";
import { AlertEntry, StatusLevel } from "@/app/lib/mockData";

const STATUS_BADGE: Record<StatusLevel, { label: string; cls: string }> = {
  BAIK: {
    label: "Baik",
    cls:   "bg-[var(--color-secondary)]/10 text-[var(--color-on-secondary-container)]",
  },
  WASPADA: {
    label: "Waspada",
    cls:   "bg-[var(--color-tertiary-container)]/20 text-[var(--color-on-tertiary-container)]",
  },
  KRITIS: {
    label: "Kritis",
    cls:   "bg-[var(--color-error-container)]/30 text-[var(--color-on-error-container)]",
  },
};

export default function AlertTable({ alerts }: { alerts: AlertEntry[] }) {
  return (
    <article className="bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/40 p-6 flex flex-col animate-slide-up animation-delay-400">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">Peringatan Terbaru</h3>
          <p className="text-xs text-[var(--color-outline)] mt-0.5">{alerts.length} entri tersimpan</p>
        </div>
        <Link
          href="/riwayat-peringatan"
          className="text-xs font-semibold text-[var(--color-primary)] hover:underline underline-offset-2 transition-colors"
        >
          Lihat Semua →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full min-w-[360px]">
          <thead>
            <tr className="border-b border-[var(--color-outline-variant)]/30">
              <th className="pb-2.5 text-left text-xs font-semibold text-[var(--color-on-surface-variant)] pl-1 w-28">Status</th>
              <th className="pb-2.5 text-left text-xs font-semibold text-[var(--color-on-surface-variant)]">Parameter</th>
              <th className="pb-2.5 text-right text-xs font-semibold text-[var(--color-on-surface-variant)] pr-1">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, idx) => {
              const badge = STATUS_BADGE[alert.status];
              return (
                <tr
                  key={alert.id}
                  className="border-b border-[var(--color-outline-variant)]/10 last:border-0 hover:bg-[var(--color-surface-container-low)]/50 transition-colors group"
                  style={{ animationDelay: `${400 + idx * 60}ms` }}
                >
                  <td className="py-3.5 pl-1">
                    <span className={["inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold", badge.cls].join(" ")}>
                      {alert.status === "KRITIS" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot" />
                      )}
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <p className="text-sm font-medium text-[var(--color-on-surface)]">{alert.parameter}</p>
                    <p className="text-xs text-[var(--color-outline)]">{alert.value}</p>
                  </td>
                  <td className="py-3.5 pr-1 text-right">
                    <p className="text-xs font-medium text-[var(--color-on-surface-variant)]">{alert.date}</p>
                    <p className="text-xs text-[var(--color-outline)] font-mono">{alert.time}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
