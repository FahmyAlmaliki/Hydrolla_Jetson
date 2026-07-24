export default function PrediksiAILoading() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header skeleton */}
      <div>
        <div className="h-6 w-48 rounded-lg bg-[var(--color-surface-container-high)] animate-pulse" />
        <div className="h-4 w-72 rounded-lg bg-[var(--color-surface-container-high)] animate-pulse mt-2" />
      </div>

      {/* AI header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-container-high)] animate-pulse" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-40 rounded-md bg-[var(--color-surface-container-high)] animate-pulse" />
          <div className="h-3 w-56 rounded-md bg-[var(--color-surface-container-high)] animate-pulse" />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-4 rounded-2xl border border-dashed border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)]/50">
        <div className="relative w-14 h-14">
          {/* Spinner ring */}
          <svg
            className="w-14 h-14 animate-spin text-[var(--color-primary)]"
            viewBox="0 0 56 56"
            fill="none"
          >
            <circle
              cx="28"
              cy="28"
              r="22"
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="4"
            />
            <path
              d="M28 6a22 22 0 0 1 22 22"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          {/* Icon center */}
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-primary)]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-60">
              <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-semibold text-[var(--color-on-surface-variant)]">
            Memuat Data Prediksi AI...
          </p>
          <p className="text-xs text-[var(--color-outline)] text-center max-w-xs">
            Sedang mengambil hasil inferensi CNN-LSTM dari InfluxDB
          </p>
        </div>
      </div>

      {/* Prediction card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] p-4 flex flex-col gap-3"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-container-high)] animate-pulse" />
              <div className="h-4 w-16 rounded-md bg-[var(--color-surface-container-high)] animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded-lg bg-[var(--color-surface-container-high)] animate-pulse" />
            <div className="h-3 w-full rounded-md bg-[var(--color-surface-container-high)] animate-pulse" />
            <div className="h-3 w-2/3 rounded-md bg-[var(--color-surface-container-high)] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-container-high)] animate-pulse" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-40 rounded-md bg-[var(--color-surface-container-high)] animate-pulse" />
            <div className="h-3 w-32 rounded-md bg-[var(--color-surface-container-high)] animate-pulse" />
          </div>
        </div>
        <div className="w-full h-64 rounded-xl bg-[var(--color-surface-container-high)] animate-pulse" />
      </div>
    </div>
  );
}
