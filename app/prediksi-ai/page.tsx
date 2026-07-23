import { getDashboardData } from "@/app/lib/dataService";
import AIPredictionWidget from "@/app/components/AIPredictionWidget";

export const revalidate = 10;

export default async function AIPredictionPage() {
  const data = await getDashboardData();
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-on-surface)] leading-tight">
          Prediksi AI (CNN-LSTM)
        </h1>
        <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
          Hasil inferensi model untuk memantau tren kualitas air
        </p>
      </div>
      <AIPredictionWidget data={data.aiPrediction} chart={data.aiChart} />
    </div>
  );
}
