import { getInfluxQueryApi, INFLUX_BUCKET, isInfluxConfigured } from "./influxClient";
import {
  SensorReading,
  AlertEntry,
  ChartPoint,
  mockSensorData,
  mockChartData,
  mockAlerts,
  mockAIPrediction,
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
async function fetchChartDataFromInflux(): Promise<ChartPoint[]> {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "ph" or r._field == "do" or
                           r._field == "temperature" or r._field == "nh3")
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length === 0) return mockChartData;

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
    return mockChartData;
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
//  Public API — dipakai oleh page.tsx & komponen lain
// ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  sensors: SensorReading[];
  chart: ChartPoint[];
  alerts: AlertEntry[];
  aiPrediction: typeof mockAIPrediction;
  dataSource: "influxdb" | "mock";
}

/**
 * Satu fungsi untuk ambil semua data dashboard.
 * - Jika InfluxDB belum dikonfigurasi → pakai mock data sepenuhnya.
 * - Jika NEXT_PUBLIC_FORCE_MOCK=true → pakai mock data sepenuhnya.
 * - Jika InfluxDB tersedia → fetch semua dari InfluxDB, fallback per-field ke mock.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const forceMock = process.env.NEXT_PUBLIC_FORCE_MOCK === "true";
  const useInflux = isInfluxConfigured() && !forceMock;

  if (!useInflux) {
    return {
      sensors:      mockSensorData,
      chart:        mockChartData,
      alerts:       mockAlerts,
      aiPrediction: mockAIPrediction,
      dataSource:   "mock",
    };
  }

  // Fetch semua secara paralel untuk efisiensi
  const [sensors, chart, alerts] = await Promise.all([
    fetchSensorReadingsFromInflux(),
    fetchChartDataFromInflux(),
    fetchAlertsFromInflux(),
  ]);

  return {
    sensors,
    chart,
    alerts,
    aiPrediction: mockAIPrediction, // AI masih mock sampai model LSTM diintegrasikan
    dataSource: "influxdb",
  };
}
