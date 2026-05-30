import { InfluxDB, QueryApi } from "@influxdata/influxdb-client";

/**
 * Singleton InfluxDB QueryApi.
 * Mengembalikan null jika env vars belum dikonfigurasi.
 */
let _queryApi: QueryApi | null = null;

export function normalizeInfluxUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (!parsed.port) {
        parsed.port = "8086";
      }
      return parsed.toString().replace(/\/+$/, "");
    } catch {
      return trimmed;
    }
  }
  try {
    const parsed = new URL(`http://${trimmed}`);
    if (!parsed.port) {
      parsed.port = "8086";
    }
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return `http://${trimmed}:8086`;
  }
}

export function getInfluxQueryApi(): QueryApi | null {
  const url    = process.env.INFLUXDB_URL;
  const token  = process.env.INFLUXDB_TOKEN;

  if (!url || !token) return null;

  if (!_queryApi) {
    const client = new InfluxDB({ url: normalizeInfluxUrl(url), token });
    _queryApi = client.getQueryApi(process.env.INFLUXDB_ORG ?? "hydrola");
  }

  return _queryApi;
}

/** Nama bucket InfluxDB */
export const INFLUX_BUCKET = process.env.INFLUXDB_BUCKET ?? "water_quality";

/** Cek apakah InfluxDB sudah dikonfigurasi */
export function isInfluxConfigured(): boolean {
  return !!(process.env.INFLUXDB_URL && process.env.INFLUXDB_TOKEN);
}