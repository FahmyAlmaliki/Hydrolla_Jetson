import { getInfluxQueryApi, INFLUX_BUCKET, isInfluxConfigured } from "./influxClient";
import {
  SensorReading,
  ChartPoint,
  AIPredictionResult,
  AIPredictionChartPoint,
  getPhStatus,
  getDoStatus,
  getSuhuStatus,
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
//  FR 1: Sensor Readings — nilai terkini + history 10 titik
// ─────────────────────────────────────────────────────────────────

/**
 * Ambil pembacaan sensor terbaru dari InfluxDB.
 * Range diperluas ke -7d agar selalu mendapat data terakhir
 * meskipun sensor sempat offline beberapa jam.
 */
async function fetchSensorReadingsFromInflux(): Promise<SensorReading[]> {
  // Query 1: nilai terkini (last per field)
  const fluxLatest = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -7d)
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "ph" or r._field == "do" or
                           r._field == "temperature")
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  // Query 2: history 10 titik terakhir untuk sparkline
  const fluxHistory = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -7d)
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "ph" or r._field == "do" or
                           r._field == "temperature")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 10)
      |> sort(columns: ["_time"], desc: false)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  try {
    const [latestRows, historyRows] = await Promise.all([
      runQuery(fluxLatest),
      runQuery(fluxHistory),
    ]);

    if (latestRows.length === 0) return [];

    const row  = latestRows[0];
    const ph   = Number(row.ph          ?? 0);
    const doV  = Number(row.do          ?? 0);
    const temp = Number(row.temperature ?? 0);

    // Extract per-field history arrays
    const histPh   = historyRows.map((r) => Number(r.ph          ?? ph));
    const histDo   = historyRows.map((r) => Number(r.do          ?? doV));
    const histTemp = historyRows.map((r) => Number(r.temperature ?? temp));

    // Ensure at least one point in history
    const safeHist = (arr: number[], fallback: number) =>
      arr.length > 0 ? arr : [fallback];

    return [
      {
        parameter: "Suhu",
        value: parseFloat(temp.toFixed(1)),
        unit: "°C",
        status: getSuhuStatus(temp),
        idealLabel: "Ideal: 25 – 30 °C",
        history: safeHist(histTemp, temp),
      },
      {
        parameter: "pH",
        value: parseFloat(ph.toFixed(2)),
        unit: "",
        status: getPhStatus(ph),
        idealLabel: "Ideal: 6.5 – 8.5",
        history: safeHist(histPh, ph),
      },
      {
        parameter: "DO",
        value: parseFloat(doV.toFixed(2)),
        unit: "mg/L",
        status: getDoStatus(doV),
        idealLabel: "Ideal: > 5 mg/L",
        history: safeHist(histDo, doV),
      },
    ];
  } catch (err) {
    console.error("[HYDROLA] InfluxDB sensor query failed:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
//  FR 1: Chart — historis per rentang waktu
// ─────────────────────────────────────────────────────────────────

/**
 * Ambil data historis untuk line chart.
 * Menggunakan aggregateWindow sesuai rentang.
 */
async function fetchChartDataFromInflux(range: ChartRange): Promise<ChartPoint[]> {
  const config = getChartQueryConfig(range);
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: ${config.start})
      |> filter(fn: (r) => r._measurement == "water_quality")
      |> filter(fn: (r) => r._field == "ph" or r._field == "do" or
                           r._field == "temperature")
      |> aggregateWindow(every: ${config.window}, fn: mean, createEmpty: false)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length === 0) return [];

    return rows.map((row) => {
      const t  = new Date(row._time as string);
      
      // Paksa zona waktu ke WIB (Asia/Jakarta) agar tidak berantakan saat di-deploy ke Docker (yang default-nya UTC)
      const timeStr = t.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(/\./g, ":"); // Format id-ID kadang memakai titik (mis. 09.11)
      
      let timeLabel = timeStr;
      if (range === "30d") {
        timeLabel = t.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short" });
      } else if (range === "7d") {
        const dateStr = t.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short" });
        timeLabel = `${dateStr} ${timeStr}`;
      }

      return {
        time: timeLabel,
        pH:   parseFloat((Number(row.ph)          || 0).toFixed(2)),
        DO:   parseFloat((Number(row.do)          || 0).toFixed(2)),
        suhu: parseFloat((Number(row.temperature) || 0).toFixed(1)),
      };
    });
  } catch (err) {
    console.error("[HYDROLA] InfluxDB chart query failed:", err);
    return [];
  }
}


// ─────────────────────────────────────────────────────────────────
//  AI Predictions — baca hasil inferensi dari InfluxDB
// ─────────────────────────────────────────────────────────────────

async function fetchAIPredictionFromInflux(): Promise<AIPredictionResult | null> {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "ai_predictions")
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      current_temperature:   Number(row.current_temperature   ?? 0),
      current_ph:            Number(row.current_ph            ?? 0),
      current_do:            Number(row.current_do            ?? 0),
      predicted_temperature: Number(row.predicted_temperature ?? 0),
      predicted_ph:          Number(row.predicted_ph          ?? 0),
      predicted_do:          Number(row.predicted_do          ?? 0),
      offset_temperature:    Number(row.offset_temperature    ?? 0),
      offset_ph:             Number(row.offset_ph             ?? 0),
      offset_do:             Number(row.offset_do             ?? 0),
      accuracy_temperature:  Number(row.accuracy_temperature  ?? 0),
      accuracy_ph:           Number(row.accuracy_ph           ?? 0),
      accuracy_do:           Number(row.accuracy_do           ?? 0),
      status_temperature:    String(row.status_temperature ?? "OK") as "OK" | "ANOMALI",
      status_ph:             String(row.status_ph          ?? "OK") as "OK" | "ANOMALI",
      status_do:             String(row.status_do          ?? "OK") as "OK" | "ANOMALI",
      timestamp:             String(row._time ?? new Date().toISOString()),
    };
  } catch (err) {
    console.error("[HYDROLA] InfluxDB AI prediction query failed:", err);
    return null;
  }
}

async function fetchAIPredictionHistoryFromInflux(): Promise<AIPredictionChartPoint[]> {
  const flux = `
    from(bucket: "${INFLUX_BUCKET}")
      |> range(start: -24h)
      |> filter(fn: (r) => r._measurement == "ai_predictions")
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 20)
      |> sort(columns: ["_time"], desc: false)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  `;

  try {
    const rows = await runQuery(flux);
    if (rows.length < 1) return [];

    return rows.map((row, i) => ({
      time:       `${i}`,
      actualSuhu: Number(row.current_temperature   ?? 0),
      predSuhu:   Number(row.predicted_temperature ?? 0),
      actualPh:   Number(row.current_ph            ?? 0),
      predPh:     Number(row.predicted_ph          ?? 0),
      actualDo:   Number(row.current_do            ?? 0),
      predDo:     Number(row.predicted_do          ?? 0),
    }));
  } catch (err) {
    console.error("[HYDROLA] InfluxDB AI prediction history query failed:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  sensors:      SensorReading[];
  chart:        ChartPoint[];
  aiPrediction: AIPredictionResult | null;
  aiChart:      AIPredictionChartPoint[];
  dataSource:   "influxdb" | "unconfigured";
}

export type ChartRange = "30m" | "1h" | "6h" | "24h" | "7d" | "30d";

function getChartQueryConfig(range: ChartRange) {
  switch (range) {
    case "30m": return { start: "-30m", window: "1m",  mockCount: 30 };
    case "1h":  return { start: "-1h",  window: "2m",  mockCount: 30 };
    case "6h":  return { start: "-6h",  window: "15m", mockCount: 25 };
    case "7d":  return { start: "-7d",  window: "6h",  mockCount: 29 };
    case "30d": return { start: "-30d", window: "1d",  mockCount: 31 };
    case "24h":
    default:    return { start: "-24h", window: "1h",  mockCount: 25 };
  }
}

/**
 * Satu fungsi untuk ambil semua data dashboard dari InfluxDB.
 * Tidak ada fallback ke mock — jika tidak ada data, return array kosong / null.
 * UI sudah menangani state kosong secara graceful.
 */
export async function getDashboardData(chartRange: ChartRange = "24h"): Promise<DashboardData> {
  if (!isInfluxConfigured()) {
    return {
      sensors:      [],
      chart:        [],
      aiPrediction: null,
      aiChart:      [],
      dataSource:   "unconfigured",
    };
  }

  const [sensors, chart, aiPrediction, aiChart] = await Promise.all([
    fetchSensorReadingsFromInflux(),
    fetchChartDataFromInflux(chartRange),
    fetchAIPredictionFromInflux(),
    fetchAIPredictionHistoryFromInflux(),
  ]);

  // Sinkronkan nilai AKTUAL AI dengan pembacaan sensor terkini
  // agar tidak ada perbedaan angka di UI
  if (aiPrediction && sensors.length > 0) {
    const getVal = (param: string) => sensors.find(s => s.parameter === param)?.value ?? 0;
    aiPrediction.current_ph = getVal("pH");
    aiPrediction.current_do = getVal("DO");
    aiPrediction.current_temperature = getVal("Suhu");
    
    // Hitung ulang offset
    aiPrediction.offset_ph = Number((aiPrediction.predicted_ph - aiPrediction.current_ph).toFixed(2));
    aiPrediction.offset_do = Number((aiPrediction.predicted_do - aiPrediction.current_do).toFixed(2));
    aiPrediction.offset_temperature = Number((aiPrediction.predicted_temperature - aiPrediction.current_temperature).toFixed(2));

    // Sinkronkan juga titik terakhir di grafik AI agar persis sama dengan card
    if (aiChart && aiChart.length > 0) {
      const lastIdx = aiChart.length - 1;
      aiChart[lastIdx].actualPh = aiPrediction.current_ph;
      aiChart[lastIdx].actualDo = aiPrediction.current_do;
      aiChart[lastIdx].actualSuhu = aiPrediction.current_temperature;
      
      // Samakan juga prediksinya untuk berjaga-jaga
      aiChart[lastIdx].predPh = aiPrediction.predicted_ph;
      aiChart[lastIdx].predDo = aiPrediction.predicted_do;
      aiChart[lastIdx].predSuhu = aiPrediction.predicted_temperature;
    }
  }

  return {
    sensors,
    chart,
    aiPrediction,
    aiChart,
    dataSource: "influxdb",
  };
}
