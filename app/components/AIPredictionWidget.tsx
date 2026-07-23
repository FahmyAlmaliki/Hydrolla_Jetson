"use client";

import type { AIPredictionResult, AIPredictionChartPoint } from "@/app/lib/mockData";
import PredictionCard from "@/app/components/PredictionCard";
import PredictionChart from "@/app/components/PredictionChart";

const ICONS = {
  suhu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
    </svg>
  ),
  ph: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.428 15.428a2 2 0 0 0-1.022-.547l-2.387-.477a6 6 0 0 0-3.86.517l-.318.158a6 6 0 0 1-3.86.517L6.05 15.21a2 2 0 0 0-1.806.547M8 4h8l-1 1v5.172a2 2 0 0 0 .586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 0 0 9 10.172V5L8 4Z" />
    </svg>
  ),
  do: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
  ),
};

export default function AIPredictionWidget({
  data,
  chart,
}: {
  data: AIPredictionResult | null;
  chart: AIPredictionChartPoint[];
}) {
  return (
    <section aria-label="Prediksi AI" className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">
            Prediksi AI (CNN-LSTM)
          </h3>
          <p className="text-xs text-[var(--color-outline)]">
            Model memprediksi nilai 1 langkah ke depan
          </p>
        </div>
      </div>

      {!data ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 rounded-2xl border border-dashed border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-lowest)]/50">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--color-surface-container)] text-[var(--color-outline)]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">
            Data prediksi AI belum tersedia
          </p>
          <p className="text-xs text-[var(--color-outline)] text-center max-w-sm">
            Model CNN-LSTM membutuhkan minimal 20 data sensor untuk mulai melakukan inferensi. Data sensor akan otomatis dikumpulkan dari InfluxDB.
          </p>
        </div>
      ) : (
        <>
          {/* 3 Prediction Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PredictionCard
              label="Suhu"
              unit="°C"
              currentValue={data.current_temperature}
              predictedValue={data.predicted_temperature}
              offset={data.offset_temperature}
              accuracy={data.accuracy_temperature}
              status={data.status_temperature}
              icon={ICONS.suhu}
              delay={0}
            />
            <PredictionCard
              label="pH"
              unit=""
              currentValue={data.current_ph}
              predictedValue={data.predicted_ph}
              offset={data.offset_ph}
              accuracy={data.accuracy_ph}
              status={data.status_ph}
              icon={ICONS.ph}
              delay={80}
            />
            <PredictionCard
              label="DO (Oksigen)"
              unit="mg/L"
              currentValue={data.current_do}
              predictedValue={data.predicted_do}
              offset={data.offset_do}
              accuracy={data.accuracy_do}
              status={data.status_do}
              icon={ICONS.do}
              delay={160}
            />
          </div>

          {/* Prediction Trend Chart */}
          <PredictionChart data={chart} />
        </>
      )}
    </section>
  );
}
