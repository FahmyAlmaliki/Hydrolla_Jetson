import { getInfluxQueryApi, INFLUX_BUCKET, isInfluxConfigured } from "./influxClient";
import {
  SensorReading,
  AlertEntry,
  ChartPoint,
  AIPredictionResult,
  AIPredictionChartPoint,
  mockSensorData,
  mockChartData,
  mockAlerts,
  mockAIPredictionResult,
  mockAIPredictionChart,
  getPhStatus,
  getDoStatus,
  getSuhuStatus,
  getNH3Status,
} from "./mockData";

// ─────────────────────────────────────────────────────────────────
//  Flux query helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Jalankan Flux query dan kumpulkan hasilnya.
 * Mengembalikan array of row objects.
 */
async function runQuery(flux: string): Promise<Record<string, unknown>[]> {
  const api = getInfluxQueryApi();
  if (!api) return [];

  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    api.queryRows(flux, {
      next(row, tableMeta) {
        rows.push(tableMeta.toObject(row));
      },
      error: reject,
      complete() {
        resolve(rows);
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────────
//  FR 1: Sensor Readings — nilai terkini
// ─────────────────────────────────────────────────────────────────

/**
 * Ambil pembacaan sensor terbaru dari InfluxDB.
 *
 * Asumsi measurement schema di InfluxDB:
 *   measurement: "water_quality"
 *   fields     : ph, do, temperature, nh3
 *   tags       : sensor_id, location
 *
 * Sesuaikan field name di bawah jika schema berbeda.
 */
async function fetchSensorReadingsFromInflux(): Promise<SensorReading[]> {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -1m)
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "ph" or r._field == "do" or
                           r._field == "temperature" or r._field == "nh3")
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length === 0) return mockSensorData; // fallback

    const row = rows[0];
    const ph   = Number(row.ph   ?? 7.0);
    const doV  = Number(row.do   ?? 6.0);
    const temp = Number(row.temperature ?? 27.0);
    const nh3  = Number(row.nh3  ?? 0.02);

    return [
      {
        parameter: "pH",
        value: parseFloat(ph.toFixed(2)),
        unit: "",
        status: getPhStatus(ph),
        idealLabel: "Ideal: 6.5 – 8.5",
        history: mockSensorData[0].history, // history tetap mock sampai FR chart selesai
      },
      {
        parameter: "DO",
        value: parseFloat(doV.toFixed(2)),
        unit: "mg/L",
        status: getDoStatus(doV),
        idealLabel: "Ideal: > 5 mg/L",
        history: mockSensorData[1].history,
      },
      {
        parameter: "Suhu",
        value: parseFloat(temp.toFixed(1)),
        unit: "°C",
        status: getSuhuStatus(temp),
        idealLabel: "Ideal: 25 – 30 °C",
        history: mockSensorData[2].history,
      },
      {
        parameter: "NH3",
        value: parseFloat(nh3.toFixed(3)),
        unit: "mg/L",
        status: getNH3Status(nh3),
        idealLabel: "Ideal: < 0.05 mg/L",
        history: mockSensorData[3].history,
      },
    ];
  } catch (err) {
    console.error("[HYDROLA] InfluxDB sensor query failed, falling back to mock:", err);
    return mockSensorData;
  }
}

// ─────────────────────────────────────────────────────────────────
//  FR 1: Chart — 24 jam terakhir (per jam)
// ─────────────────────────────────────────────────────────────────

/**
 * Ambil data historis 24 jam untuk line chart.
 * Menggunakan aggregateWindow 1 jam (mean).
 */
async function fetchChartDataFromInflux(range: ChartRange): Promise<ChartPoint[]> {
  const config = getChartQueryConfig(range);
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: ${config.start})
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "ph" or r._field == "do" or
                           r._field == "temperature" or r._field == "nh3")
      |> aggregateWindow(every: ${config.window}, fn: mean, createEmpty: false)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length === 0) return mockChartData.slice(-config.mockCount);

    return rows.map((row) => {
      const t = new Date(row._time as string);
      const hh = t.getHours().toString().padStart(2, "0");
      const mm = t.getMinutes().toString().padStart(2, "0");
      return {
        time: `${hh}:${mm}`,
        pH:   parseFloat((Number(row.ph)          || 7.0).toFixed(2)),
        DO:   parseFloat((Number(row.do)          || 6.0).toFixed(2)),
        suhu: parseFloat((Number(row.temperature) || 27.0).toFixed(1)),
        NH3:  parseFloat((Number(row.nh3)         || 0.02).toFixed(3)),
      };
    });
  } catch (err) {
    console.error("[HYDROLA] InfluxDB chart query failed, falling back to mock:", err);
    return mockChartData.slice(-config.mockCount);
  }
}

// ─────────────────────────────────────────────────────────────────
//  FR 4: Alert History
// ─────────────────────────────────────────────────────────────────

/**
 * Ambil riwayat peringatan dari InfluxDB.
 *
 * Asumsi: alert log disimpan sebagai measurement "alerts"
 * dengan fields: parameter (string), value (float), status (string).
 */
async function fetchAlertsFromInflux(): Promise<AlertEntry[]> {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "alerts")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 20)
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length === 0) return mockAlerts;

    return rows.map((row, i) => {
      const t = new Date(row._time as string);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      let dateLabel: string;
      if (t.toDateString() === today.toDateString()) {
        dateLabel = "Hari ini";
      } else if (t.toDateString() === yesterday.toDateString()) {
        dateLabel = "Kemarin";
      } else {
        dateLabel = t.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      }

      const statusRaw = String(row.status ?? "WASPADA").toUpperCase();
      const status =
        statusRaw === "KRITIS" ? "KRITIS" :
        statusRaw === "BAIK"   ? "BAIK"   : "WASPADA";

      return {
        id: String(i),
        status,
        parameter: String(row.parameter ?? "Parameter"),
        value: String(row._value ?? "-"),
        time: t.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        date: dateLabel,
      } satisfies AlertEntry;
    });
  } catch (err) {
    console.error("[HYDROLA] InfluxDB alert query failed, falling back to mock:", err);
    return mockAlerts;
  }
}

// ─────────────────────────────────────────────────────────────────
//  AI Predictions — baca hasil inferensi dari InfluxDB
// ─────────────────────────────────────────────────────────────────

async function fetchAIPredictionFromInflux(): Promise<AIPredictionResult | null> {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -5m)
      |> filter(fn: (r) => r._measurement == "ai_predictions")
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      current_temperature: Number(row.current_temperature ?? 0),
      current_ph:          Number(row.current_ph ?? 0),
      current_do:          Number(row.current_do ?? 0),
      predicted_temperature: Number(row.predicted_temperature ?? 0),
      predicted_ph:         Number(row.predicted_ph ?? 0),
      predicted_do:         Number(row.predicted_do ?? 0),
      offset_temperature:   Number(row.offset_temperature ?? 0),
      offset_ph:            Number(row.offset_ph ?? 0),
      offset_do:            Number(row.offset_do ?? 0),
      accuracy_temperature: Number(row.accuracy_temperature ?? 0),
      accuracy_ph:          Number(row.accuracy_ph ?? 0),
      accuracy_do:          Number(row.accuracy_do ?? 0),
      status_temperature:   String(row.status_temperature ?? "OK") as "OK" | "ANOMALI",
      status_ph:            String(row.status_ph ?? "OK") as "OK" | "ANOMALI",
      status_do:            String(row.status_do ?? "OK") as "OK" | "ANOMALI",
      timestamp:            String(row._time ?? new Date().toISOString()),
    };
  } catch (err) {
    console.error("[HYDROLA] InfluxDB AI prediction query failed:", err);
    return null;
  }
}

async function fetchAIPredictionHistoryFromInflux(): Promise<AIPredictionChartPoint[]> {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -30m)
      |> filter(fn: (r) => r._measurement == "ai_predictions")
      |> sort(columns: ["_time"], desc: false)
      |> limit(n: 20)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length < 2) return [];

    return rows.map((row, i) => ({
      time: `${i}`,
      actualSuhu: Number(row.current_temperature ?? 0),
      predSuhu:   Number(row.predicted_temperature ?? 0),
      actualPh:   Number(row.current_ph ?? 0),
      predPh:     Number(row.predicted_ph ?? 0),
      actualDo:   Number(row.current_do ?? 0),
      predDo:     Number(row.predicted_do ?? 0),
    }));
  } catch (err) {
    console.error("[HYDROLA] InfluxDB AI prediction history query failed:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
//  Public API — dipakai oleh page.tsx & komponen lain
// ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  sensors: SensorReading[];
  chart: ChartPoint[];
  alerts: AlertEntry[];
  aiPrediction: AIPredictionResult | null;
  aiChart: AIPredictionChartPoint[];
  dataSource: "influxdb" | "mock";
}

export type ChartRange = "6h" | "24h" | "7d" | "30d";

function getChartQueryConfig(range: ChartRange) {
  switch (range) {
    case "6h":
      return { start: "-6h", window: "15m", mockCount: 25 };
    case "7d":
      return { start: "-7d", window: "6h", mockCount: 29 };
    case "30d":
      return { start: "-30d", window: "1d", mockCount: 31 };
    case "24h":
    default:
      return { start: "-24h", window: "1h", mockCount: 25 };
  }
}

/**
 * Satu fungsi untuk ambil semua data dashboard.
 * - Jika InfluxDB belum dikonfigurasi → pakai mock data sepenuhnya.
 * - Jika NEXT_PUBLIC_FORCE_MOCK=true → pakai mock data sepenuhnya.
 * - Jika InfluxDB tersedia → fetch semua dari InfluxDB, fallback per-field ke mock.
 */
export async function getDashboardData(chartRange: ChartRange = "24h"): Promise<DashboardData> {
  const forceMock = process.env.NEXT_PUBLIC_FORCE_MOCK === "true";
  const useInflux = isInfluxConfigured() && !forceMock;

  if (!useInflux) {
    return {
      sensors:      mockSensorData,
      chart:        mockChartData,
      alerts:       mockAlerts,
      aiPrediction: null,
      aiChart:      [],
      dataSource:   "mock",
    };
  }

  // Fetch semua secara paralel untuk efisiensi
  const [sensors, chart, alerts, aiPrediction, aiChart] = await Promise.all([
    fetchSensorReadingsFromInflux(),
    fetchChartDataFromInflux(chartRange),
    fetchAlertsFromInflux(),
    fetchAIPredictionFromInflux(),
    fetchAIPredictionHistoryFromInflux(),
  ]);

  return {
    sensors,
    chart,
    alerts,
    aiPrediction,
    aiChart,
    dataSource: "influxdb",
  };
}
