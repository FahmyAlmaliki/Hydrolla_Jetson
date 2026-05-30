"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────
interface FieldDef {
  name: string;
  type?: string;
  description?: string;
}
interface TagDef {
  name: string;
  description?: string;
}
interface MeasurementDef {
  name: string;
  fields: FieldDef[];
  tags: TagDef[];
  retentionPolicy?: string;
  writeFrequency?: string;
  cardinality?: number | null;
}
interface SchemaResponse {
  status: "connected" | "disconnected" | "error";
  source: "live" | "static";
  bucket: string;
  org: string;
  url: string | null;
  measurements: MeasurementDef[];
  queriedAt: string;
  message?: string;
}

function normalizeSchemaResponse(data: Partial<SchemaResponse>): SchemaResponse {
  return {
    status: data.status === "connected" || data.status === "error" ? data.status : "disconnected",
    source: data.source === "live" ? "live" : "static",
    bucket: data.bucket ?? "water_quality",
    org: data.org ?? "hydrola",
    url: data.url ?? null,
    measurements: Array.isArray(data.measurements) ? data.measurements : [],
    queriedAt: data.queriedAt ?? new Date().toISOString(),
    message: data.message,
  };
}

// ─────────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────────
function Badge({
  children,
  color = "blue",
}: {
  children: React.ReactNode;
  color?: "blue" | "green" | "amber" | "red" | "gray" | "purple";
}) {
  const colors = {
    blue:   "bg-[#dbeafe] text-[#1e40af]",
    green:  "bg-[#dcfce7] text-[#166534]",
    amber:  "bg-[#fef3c7] text-[#92400e]",
    red:    "bg-[#fee2e2] text-[#991b1b]",
    gray:   "bg-[#f3f4f6] text-[#374151]",
    purple: "bg-[#ede9fe] text-[#5b21b6]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${colors[color]}`}
    >
      {children}
    </span>
  );
}

function FieldTypeChip({ type }: { type?: string }) {
  if (!type) return null;
  const map: Record<string, { label: string; color: "blue" | "green" | "purple" | "amber" | "gray" }> = {
    float:  { label: "float",  color: "blue" },
    string: { label: "string", color: "green" },
    int:    { label: "int",    color: "purple" },
    bool:   { label: "bool",   color: "amber" },
  };
  const cfg = map[type] ?? { label: type, color: "gray" };
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}

function StatusDot({ status }: { status: SchemaResponse["status"] }) {
  const cfg = {
    connected:    { dot: "bg-[var(--color-secondary)] animate-pulse-dot", label: "Terhubung · Live Schema" },
    disconnected: { dot: "bg-[var(--color-outline)]",                     label: "Tidak Terhubung · Schema Statis" },
    error:        { dot: "bg-[var(--color-error)] animate-pulse-dot",     label: "Error koneksi" },
  }[status];

  return (
    <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────
export default function InfluxSchemaPanel() {
  const [schema, setSchema]   = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["water_quality"]));

  useEffect(() => {
    fetch("/api/influx-schema")
      .then((r) => r.json())
      .then((data: SchemaResponse) => {
        const normalized = normalizeSchemaResponse(data);
        setSchema(normalized);
        // auto-expand all measurements
        setExpanded(new Set(normalized.measurements.map((m) => m.name)));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  function toggleMeasurement(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--color-outline-variant)] overflow-hidden"
        style={{ background: "var(--color-surface-container-lowest)" }}>
        <div className="px-6 py-5 border-b border-[var(--color-outline-variant)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-container-high)] animate-pulse" />
          <div className="h-4 w-40 bg-[var(--color-surface-container-high)] rounded animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-[var(--color-surface-container)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error || !schema) {
    return (
      <div className="rounded-2xl border border-[var(--color-error)]/30 px-6 py-5"
        style={{ background: "var(--color-error-container)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--color-on-error-container)" }}>
          Gagal memuat schema: {error ?? "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-slide-up rounded-2xl border border-[var(--color-outline-variant)] overflow-hidden"
      style={{ background: "var(--color-surface-container-lowest)" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-[var(--color-outline-variant)]"
        style={{ background: "var(--color-surface-container-low)" }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* DB icon */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-primary)" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <ellipse cx="12" cy="6" rx="8" ry="3" stroke="white" strokeWidth="1.5" />
                <path d="M4 6v4c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="white" strokeWidth="1.5" />
                <path d="M4 10v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" stroke="white" strokeWidth="1.5" />
                <path d="M4 14v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" stroke="white" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--color-on-surface)" }}>
                InfluxDB Schema
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
                Struktur data time-series HYDROLA
              </p>
            </div>
          </div>
          <StatusDot status={schema.status} />
        </div>
      </div>

      {/* ── Connection Info ─────────────────────────────────────── */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-[var(--color-outline-variant)]"
        style={{ background: "var(--color-surface-container-lowest)" }}>
        {[
          { label: "Bucket",  value: schema.bucket, icon: "🪣" },
          { label: "Org",     value: schema.org,    icon: "🏢" },
          { label: "URL",     value: schema.url ?? "—",  icon: "🌐" },
          { label: "Sumber",  value: schema.source === "live" ? "Query Langsung" : "Schema Statis", icon: schema.source === "live" ? "⚡" : "📋" },
        ].map((item) => (
          <div key={item.label}
            className="rounded-xl px-3 py-2.5 border border-[var(--color-outline-variant)]"
            style={{ background: "var(--color-surface-container-low)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: "var(--color-outline)" }}>
              {item.icon} {item.label}
            </p>
            <p className="text-xs font-medium truncate" style={{ color: "var(--color-on-surface)" }}
              title={item.value}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Measurements ────────────────────────────────────────── */}
      <div className="divide-y divide-[var(--color-outline-variant)]">
        {schema.measurements.map((m) => {
          const isOpen = expanded.has(m.name);
          return (
            <div key={m.name}>
              {/* Measurement header (collapsible) */}
              <button
                id={`schema-measurement-${m.name}`}
                onClick={() => toggleMeasurement(m.name)}
                className="w-full flex items-center justify-between px-6 py-4 text-left
                  hover:bg-[var(--color-surface-container-low)] transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  {/* Chevron */}
                  <svg
                    viewBox="0 0 20 20" fill="currentColor"
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    style={{ color: "var(--color-outline)" }}
                  >
                    <path fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clipRule="evenodd" />
                  </svg>

                  {/* Measurement name */}
                  <code
                    className="text-sm font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      background: "var(--color-primary-muted)",
                      color: "var(--color-primary)",
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {m.name}
                  </code>
                  <Badge color="gray">measurement</Badge>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.cardinality != null && (
                    <span className="text-xs" style={{ color: "var(--color-outline)" }}>
                      ~{m.cardinality.toLocaleString("id-ID")} series
                    </span>
                  )}
                  <Badge color="blue">{m.fields.length} field</Badge>
                  <Badge color="purple">{m.tags.length} tag</Badge>
                </div>
              </button>

              {/* Collapsible detail */}
              {isOpen && (
                <div className="px-6 pb-5 space-y-4 animate-fade-in">

                  {/* Metadata row */}
                  {(m.retentionPolicy || m.writeFrequency) && (
                    <div className="flex flex-wrap gap-3">
                      {m.retentionPolicy && (
                        <span className="flex items-center gap-1.5 text-xs"
                          style={{ color: "var(--color-on-surface-variant)" }}>
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd"
                              d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm.75-10.25a.75.75 0 0 0-1.5 0v4.5h-2a.75.75 0 0 0 0 1.5H8a.75.75 0 0 0 .75-.75v-5.25z"
                              clipRule="evenodd" />
                          </svg>
                          Retensi: <strong>{m.retentionPolicy}</strong>
                        </span>
                      )}
                      {m.writeFrequency && (
                        <span className="flex items-center gap-1.5 text-xs"
                          style={{ color: "var(--color-on-surface-variant)" }}>
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M8 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zM8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm.75 3.25a.75.75 0 0 0-1.5 0v2.5L5.47 9.53a.75.75 0 0 0 1.06 1.06l2-2A.75.75 0 0 0 8.75 8V5.25z" />
                          </svg>
                          Frekuensi: <strong>{m.writeFrequency}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Fields table */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                      style={{ color: "var(--color-outline)" }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--color-primary)" }} />
                      Fields
                    </p>
                    <div className="rounded-xl overflow-hidden border border-[var(--color-outline-variant)]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: "var(--color-surface-container)" }}>
                            <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-outline)" }}>Nama Field</th>
                            <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-outline)" }}>Tipe</th>
                            <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell" style={{ color: "var(--color-outline)" }}>Deskripsi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-outline-variant)]">
                          {m.fields.map((f) => (
                            <tr key={f.name}
                              className="hover:bg-[var(--color-surface-container-low)] transition-colors"
                              style={{ background: "var(--color-surface-container-lowest)" }}>
                              <td className="px-3 py-2.5">
                                <code
                                  className="font-mono font-semibold text-[11px]"
                                  style={{ color: "var(--color-primary)" }}
                                >
                                  _field: {f.name}
                                </code>
                              </td>
                              <td className="px-3 py-2.5">
                                <FieldTypeChip type={f.type} />
                              </td>
                              <td className="px-3 py-2.5 hidden sm:table-cell"
                                style={{ color: "var(--color-on-surface-variant)" }}>
                                {f.description ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tags table */}
                  {m.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                        style={{ color: "var(--color-outline)" }}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#7c3aed" }} />
                        Tags
                      </p>
                      <div className="rounded-xl overflow-hidden border border-[var(--color-outline-variant)]">
                        <table className="w-full text-xs">
                          <thead>
                            <tr style={{ background: "var(--color-surface-container)" }}>
                              <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-outline)" }}>Nama Tag</th>
                              <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-outline)" }}>Peran</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-outline-variant)]">
                            {m.tags.map((t) => (
                              <tr key={t.name}
                                className="hover:bg-[var(--color-surface-container-low)] transition-colors"
                                style={{ background: "var(--color-surface-container-lowest)" }}>
                                <td className="px-3 py-2.5">
                                  <code
                                    className="font-mono font-semibold text-[11px]"
                                    style={{ color: "#7c3aed" }}
                                  >
                                    {t.name}
                                  </code>
                                </td>
                                <td className="px-3 py-2.5" style={{ color: "var(--color-on-surface-variant)" }}>
                                  {t.description ?? "Tag untuk filtering query"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Flux example */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                      style={{ color: "var(--color-outline)" }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--color-secondary)" }} />
                      Contoh Query Flux
                    </p>
                    <pre
                      className="rounded-xl text-[11px] px-4 py-3 overflow-x-auto leading-relaxed"
                      style={{
                        background: "#0f172a",
                        color: "#e2e8f0",
                        fontFamily: "ui-monospace, monospace",
                      }}
                    >
                      <span style={{ color: "#94a3b8" }}>{`// Ambil data terbaru dari ${m.name}\n`}</span>
                      <span style={{ color: "#7dd3fc" }}>from</span>
                      <span style={{ color: "#e2e8f0" }}>{`(bucket: "`}</span>
                      <span style={{ color: "#86efac" }}>{`${schema.bucket}`}</span>
                      <span style={{ color: "#e2e8f0" }}>{`")\n  `}</span>
                      <span style={{ color: "#7dd3fc" }}>{`|> range`}</span>
                      <span style={{ color: "#e2e8f0" }}>{`(start: -1h)\n  `}</span>
                      <span style={{ color: "#7dd3fc" }}>{`|> filter`}</span>
                      <span style={{ color: "#e2e8f0" }}>{`(fn: (r) => r._measurement == "`}</span>
                      <span style={{ color: "#86efac" }}>{m.name}</span>
                      <span style={{ color: "#e2e8f0" }}>{`")\n  `}</span>
                      <span style={{ color: "#7dd3fc" }}>{`|> last`}</span>
                      <span style={{ color: "#e2e8f0" }}>{`()`}</span>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="px-6 py-3 border-t border-[var(--color-outline-variant)] flex items-center justify-between"
        style={{ background: "var(--color-surface-container-low)" }}>
        <p className="text-xs" style={{ color: "var(--color-outline)" }}>
          {schema.measurements.length} measurement ·{" "}
          {schema.measurements.reduce((acc, m) => acc + m.fields.length, 0)} total field ·{" "}
          {schema.measurements.reduce((acc, m) => acc + m.tags.length, 0)} total tag
        </p>
        <p className="text-xs" style={{ color: "var(--color-outline)" }}>
          Diperbarui: {new Date(schema.queriedAt).toLocaleTimeString("id-ID")}
        </p>
      </div>
    </div>
  );
}
