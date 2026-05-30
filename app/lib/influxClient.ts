// app/lib/influxClient.ts
// ─────────────────────────────────────────────
//  Singleton client untuk InfluxDB
//  Menyediakan: QueryApi dan WriteApi
// ─────────────────────────────────────────────

import {
  InfluxDB,
  QueryApi,
  WriteApi,
  DEFAULT_WriteOptions,
} from "@influxdata/influxdb-client";

// ─── Env vars ──────────────────────────────────
const INFLUXDB_URL   = process.env.INFLUXDB_URL   ?? "";
const INFLUXDB_TOKEN = process.env.INFLUXDB_TOKEN ?? "";
const INFLUXDB_ORG   = process.env.INFLUXDB_ORG   ?? "flagship";

export const INFLUX_BUCKET = process.env.INFLUXDB_BUCKET ?? "sensor";

// ─── Cek apakah semua env sudah diset ──────────
export function isInfluxConfigured(): boolean {
  return (
    INFLUXDB_URL.trim()   !== "" &&
    INFLUXDB_TOKEN.trim() !== "" &&
    INFLUXDB_ORG.trim()   !== ""
  );
}

// ─── Singleton instances ────────────────────────
let _client:   InfluxDB  | null = null;
let _queryApi: QueryApi  | null = null;
let _writeApi: WriteApi  | null = null;

// ─── Inisialisasi client ────────────────────────
function getClient(): InfluxDB | null {
  if (!isInfluxConfigured()) return null;

  if (!_client) {
    _client = new InfluxDB({
      url:   INFLUXDB_URL,
      token: INFLUXDB_TOKEN,
    });
  }

  return _client;
}

// ─── QueryApi ──────────────────────────────────
export function getInfluxQueryApi(): QueryApi | null {
  if (!isInfluxConfigured()) return null;

  if (!_queryApi) {
    const client = getClient();
    if (!client) return null;

    _queryApi = client.getQueryApi(INFLUXDB_ORG);
  }

  return _queryApi;
}

// ─── WriteApi ──────────────────────────────────
export function getInfluxWriteApi(): WriteApi | null {
  if (!isInfluxConfigured()) return null;

  if (!_writeApi) {
    const client = getClient();
    if (!client) return null;

    _writeApi = client.getWriteApi(INFLUXDB_ORG, INFLUX_BUCKET, "ms", {
      // Flush otomatis setiap 5 detik atau setiap 1000 poin
      ...DEFAULT_WriteOptions,
      batchSize:     1000,
      flushInterval: 5000,
      // Retry 3x jika gagal
      maxRetries:    3,
      minRetryDelay:    1000,
      // Callback jika ada error saat flush background
      writeFailed(error, lines) {
        console.error("[InfluxDB WriteApi] Gagal menulis:", error.message);
        console.error("[InfluxDB WriteApi] Lines:", lines);
      },
      writeSuccess(lines) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[InfluxDB WriteApi] ${lines.length} poin berhasil ditulis`);
        }
      },
    });
  }

  return _writeApi;
}

// ─── Graceful shutdown (opsional, untuk server cleanup) ──
export async function closeInfluxClient(): Promise<void> {
  if (_writeApi) {
    try {
      await _writeApi.close();
      console.log("[InfluxDB] WriteApi ditutup.");
    } catch (err) {
      console.error("[InfluxDB] Error saat menutup WriteApi:", err);
    } finally {
      _writeApi = null;
    }
  }
  _queryApi = null;
  _client   = null;
}