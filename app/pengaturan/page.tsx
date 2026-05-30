import InfluxSchemaPanel from "@/app/components/InfluxSchemaPanel";

export const metadata = {
  title: "Pengaturan — HYDROLA",
  description: "Konfigurasi dan informasi schema database InfluxDB HYDROLA",
};

export default function PengaturanPage() {
  return (
    <div className="flex flex-col gap-8">

      {/* ── Page Header ── */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold text-[var(--color-on-surface)] leading-tight">
          Pengaturan & Informasi Sistem
        </h1>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
          Konfigurasi koneksi, schema database, dan parameter sistem HYDROLA
        </p>
      </div>

      {/* ── InfluxDB Schema Section ── */}
      <section aria-label="InfluxDB Schema" className="animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-outline)" }}>
            Schema Database · InfluxDB
          </h2>
          <div className="flex-1 h-px" style={{ background: "var(--color-outline-variant)" }} />
        </div>
        <InfluxSchemaPanel />
      </section>

      {/* ── Environment Variables Info ── */}
      <section aria-label="Environment Variables" className="animate-slide-up animation-delay-100">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-outline)" }}>
            Konfigurasi Environment
          </h2>
          <div className="flex-1 h-px" style={{ background: "var(--color-outline-variant)" }} />
        </div>

        <div className="rounded-2xl border border-[var(--color-outline-variant)] overflow-hidden"
          style={{ background: "var(--color-surface-container-lowest)" }}>
          <div className="px-6 py-4 border-b border-[var(--color-outline-variant)]"
            style={{ background: "var(--color-surface-container-low)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>
              Variabel <code className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-container-high)" }}>.env.local</code>
            </p>
          </div>
          <div className="divide-y divide-[var(--color-outline-variant)]">
            {[
              { key: "INFLUXDB_URL",    hint: "URL server InfluxDB (contoh: http://localhost:8086)",  required: true },
              { key: "INFLUXDB_TOKEN",  hint: "Token autentikasi dari InfluxDB UI > Data > Tokens",   required: true },
              { key: "INFLUXDB_ORG",    hint: "Nama organisasi (default: hydrola)",                    required: false },
              { key: "INFLUXDB_BUCKET", hint: "Nama bucket penyimpanan sensor (default: water_quality)", required: false },
              { key: "NEXT_PUBLIC_POLL_INTERVAL_SEC", hint: "Interval polling data real-time dalam detik (default: 10)", required: false },
              { key: "NEXT_PUBLIC_FORCE_MOCK",        hint: "Set ke \"true\" untuk paksa pakai data mock",              required: false },
            ].map((env) => (
              <div key={env.key} className="flex items-start gap-4 px-6 py-3.5
                hover:bg-[var(--color-surface-container-low)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code
                      className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: "var(--color-primary-muted)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {env.key}
                    </code>
                    {env.required && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: "#fee2e2", color: "#991b1b" }}>
                        Wajib
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--color-on-surface-variant)" }}>
                    {env.hint}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
