// Mock data & types – akan diganti dengan fetch InfluxDB di masa produksi

export type StatusLevel = "BAIK" | "WASPADA" | "KRITIS";

export interface SensorReading {
  parameter: "pH" | "DO" | "Suhu" | "NH3";
  value: number;
  unit: string;
  status: StatusLevel;
  idealLabel: string;
  history: number[]; // last 10 readings for sparkline
}

export interface AlertEntry {
  id: string;
  status: StatusLevel;
  parameter: string;
  value: string;
  time: string;
  date: string;
}

export interface ChartPoint {
  time: string;
  pH: number;
  DO: number;
  suhu: number;
  NH3: number;
}

/** Determine status based on PRD thresholds */
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
export function getNH3Status(v: number): StatusLevel {
  if (v >= 0.1) return "KRITIS";
  if (v >= 0.05) return "WASPADA";
  return "BAIK";
}

/** Simulated current sensor readings */
export const mockSensorData: SensorReading[] = [
  {
    parameter: "pH",
    value: 7.2,
    unit: "",
    status: getPhStatus(7.2),
    idealLabel: "Ideal: 6.5 – 8.5",
    history: [6.9, 7.0, 7.1, 7.0, 7.2, 7.3, 7.1, 7.2, 7.2, 7.2],
  },
  {
    parameter: "DO",
    value: 6.5,
    unit: "mg/L",
    status: getDoStatus(6.5),
    idealLabel: "Ideal: > 5 mg/L",
    history: [5.8, 6.0, 6.2, 6.4, 6.3, 6.5, 6.6, 6.4, 6.5, 6.5],
  },
  {
    parameter: "Suhu",
    value: 26.5,
    unit: "°C",
    status: getSuhuStatus(26.5),
    idealLabel: "Ideal: 25 – 30 °C",
    history: [25.0, 25.5, 26.0, 26.8, 27.0, 26.5, 26.3, 26.5, 26.7, 26.5],
  },
  {
    parameter: "NH3",
    value: 0.02,
    unit: "mg/L",
    status: getNH3Status(0.02),
    idealLabel: "Ideal: < 0.05 mg/L",
    history: [0.01, 0.015, 0.018, 0.02, 0.022, 0.02, 0.019, 0.021, 0.02, 0.02],
  },
];

/** 24-hour chart data (hourly) */
export const mockChartData: ChartPoint[] = Array.from({ length: 25 }, (_, i) => {
  const hour = i.toString().padStart(2, "0") + ":00";
  const t = i / 24;
  return {
    time: hour,
    pH: parseFloat((6.9 + Math.sin(t * Math.PI * 2) * 0.4 + (Math.random() - 0.5) * 0.1).toFixed(2)),
    DO: parseFloat((6.0 + Math.cos(t * Math.PI * 1.5) * 0.8 + (Math.random() - 0.5) * 0.2).toFixed(2)),
    suhu: parseFloat((26.0 + Math.sin(t * Math.PI + 1) * 1.5 + (Math.random() - 0.5) * 0.3).toFixed(1)),
    NH3: parseFloat((0.02 + Math.abs(Math.sin(t * Math.PI * 3)) * 0.015 + (Math.random() - 0.5) * 0.003).toFixed(3)),
  };
});

/** Simulated alert history */
export const mockAlerts: AlertEntry[] = [
  { id: "1", status: "WASPADA", parameter: "Suhu Tinggi", value: "26.5°C", time: "14:30", date: "Hari ini" },
  { id: "2", status: "KRITIS",  parameter: "pH Rendah",   value: "6.1",    time: "08:15", date: "Kemarin" },
  { id: "3", status: "WASPADA", parameter: "Amonia Naik", value: "0.04 mg/L", time: "19:45", date: "10 Okt" },
  { id: "4", status: "KRITIS",  parameter: "DO Kritis",   value: "2.8 mg/L", time: "03:22", date: "9 Okt" },
  { id: "5", status: "WASPADA", parameter: "pH Tinggi",   value: "8.7",    time: "11:10", date: "7 Okt" },
];

/** AI prediction mock */
export const mockAIPrediction = {
  parameter: "Amonia (NH3)",
  horizon: "48 Jam ke Depan",
  trend: "MENURUN" as "MENURUN" | "NAIK" | "STABIL",
  confidence: 94.2,
  predictedMax: 0.038,
  safe: true,
  forecast: Array.from({ length: 9 }, (_, i) => ({
    label: `+${(i + 1) * 6}j`,
    value: parseFloat((0.02 - i * 0.001 + (Math.random() - 0.5) * 0.003).toFixed(3)),
  })),
};
