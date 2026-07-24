// Types & utilities – semua data diambil dari InfluxDB, tidak ada mock fallback

export type StatusLevel = "BAIK" | "WASPADA" | "KRITIS";

export interface SensorReading {
  parameter: "pH" | "DO" | "Suhu";
  value: number;
  unit: string;
  status: StatusLevel;
  idealLabel: string;
  history: number[]; // last 10 readings for sparkline
}

export interface ChartPoint {
  time: string;
  pH: number;
  DO: number;
  suhu: number;
}

// ── Status helpers ────────────────────────────────────────────────

export function getPhStatus(v: number): StatusLevel {
  if (v < 6.0 || v > 9.0) return "KRITIS";
  if (v < 6.5 || v > 8.5) return "WASPADA";
  return "BAIK";
}
export function getDoStatus(v: number): StatusLevel {
  if (v < 3) return "KRITIS";
  if (v < 5) return "WASPADA";
  return "BAIK";
}
export function getSuhuStatus(v: number): StatusLevel {
  if (v < 22 || v > 32) return "KRITIS";
  if (v < 25 || v > 30) return "WASPADA";
  return "BAIK";
}

// ── AI Prediction types ───────────────────────────────────────────

export type AnomalyStatus = "OK" | "ANOMALI";

export interface AIPredictionResult {
  current_temperature: number;
  current_ph: number;
  current_do: number;
  predicted_temperature: number;
  predicted_ph: number;
  predicted_do: number;
  offset_temperature: number;
  offset_ph: number;
  offset_do: number;
  accuracy_temperature: number;
  accuracy_ph: number;
  accuracy_do: number;
  status_temperature: AnomalyStatus;
  status_ph: AnomalyStatus;
  status_do: AnomalyStatus;
  timestamp: string;
}

export function getAnomalyLabel(s: AnomalyStatus): string {
  return s === "ANOMALI" ? "Anomali" : "Normal";
}

export function getAnomalyStatus(s: AnomalyStatus): StatusLevel {
  return s === "ANOMALI" ? "KRITIS" : "BAIK";
}

export interface AIPredictionChartPoint {
  time: string;
  actualSuhu: number;
  predSuhu: number;
  actualPh: number;
  predPh: number;
  actualDo: number;
  predDo: number;
}
