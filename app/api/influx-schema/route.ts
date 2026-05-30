import { NextResponse } from "next/server";
import { getInfluxQueryApi, INFLUX_BUCKET, isInfluxConfigured } from "@/app/lib/influxClient";

export const dynamic = "force-dynamic";

const STATIC_SCHEMA = {
  status: "disconnected" as const,
  source: "static" as const,
  bucket: INFLUX_BUCKET,
  org: process.env.INFLUXDB_ORG ?? "hydrola",
  url: null as string | null,
  measurements: [
    {
      name: "water_quality",
      fields: [
        { name: "ph", type: "float", description: "Tingkat keasaman air" },
        { name: "do", type: "float", description: "Dissolved Oxygen (mg/L)" },
        { name: "temperature", type: "float", description: "Suhu air (°C)" },
        { name: "nh3", type: "float", description: "Amonia bebas (mg/L)" },
      ],
      tags: [
        { name: "sensor_id", description: "Identifikasi sensor" },
        { name: "location", description: "Lokasi kolam" },
      ],
      retentionPolicy: "30 hari",
      writeFrequency: "Setiap pembacaan sensor",
    },
    {
      name: "alerts",
      fields: [
        { name: "parameter", type: "string", description: "Nama parameter yang memicu alert" },
        { name: "value", type: "float", description: "Nilai saat alert terjadi" },
        { name: "status", type: "string", description: "KRITIS / WASPADA" },
      ],
      tags: [{ name: "source", description: "Sumber notifikasi (telegram / web)" }],
      retentionPolicy: "30 hari",
      writeFrequency: "Saat threshold terlampaui",
    },
  ],
};

function buildStaticSchema(message?: string) {
  return {
    ...STATIC_SCHEMA,
    message,
    queriedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
//  Helper: run a Flux query and collect rows
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  GET /api/influx-schema
// ─────────────────────────────────────────────
export async function GET() {
  const configured = isInfluxConfigured();

  if (!configured) {
    return NextResponse.json(buildStaticSchema());
  }

  // ── Connected: query real schema from InfluxDB ──────────────────
  try {
    const url  = process.env.INFLUXDB_URL!;
    const org  = process.env.INFLUXDB_ORG ?? "hydrola";

    // 1. Get list of measurements
    const measurementFlux = `
      import "influxdata/influxdb/schema"
      schema.measurements(bucket: "${INFLUX_BUCKET}")
    `;

    // 2. Get tag keys
    const tagKeysFlux = `
      import "influxdata/influxdb/schema"
      schema.tagKeys(bucket: "${INFLUX_BUCKET}")
    `;

    // 3. Get field keys per measurement
    const fieldKeysFlux = `
      import "influxdata/influxdb/schema"
      schema.fieldKeys(bucket: "${INFLUX_BUCKET}")
    `;

    const [measurementRows, tagRows, fieldRows] = await Promise.all([
      runQuery(measurementFlux),
      runQuery(tagKeysFlux),
      runQuery(fieldKeysFlux),
    ]);

    const measurements = measurementRows.map((r) => String(r._value ?? ""));
    const tags = tagRows
      .map((r) => String(r._value ?? ""))
      .filter((v) => !v.startsWith("_")); // exclude system tags
    const fields = fieldRows
      .map((r) => String(r._value ?? ""))
      .filter((v) => !v.startsWith("_"));

    // Get cardinality estimate
    const cardinalityFlux = `
      import "influxdata/influxdb/schema"
      schema.measurementCardinality(bucket: "${INFLUX_BUCKET}", measurement: "water_quality")
    `;
    let cardinality: number | null = null;
    try {
      const cardRows = await runQuery(cardinalityFlux);
      if (cardRows.length > 0) cardinality = Number(cardRows[0]._value ?? null);
    } catch {
      // cardinality is optional
    }

    return NextResponse.json({
      status: "connected",
      source: "live",
      bucket: INFLUX_BUCKET,
      org,
      url: url.replace(/\/\/.*@/, "//***@"), // mask credentials if any
      measurements: measurements.map((m) => ({
        name: m,
        fields: fields.map((f) => ({ name: f, type: "float" })),
        tags: tags.map((t) => ({ name: t })),
        cardinality,
      })),
      rawTagKeys: tags,
      rawFieldKeys: fields,
      queriedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(buildStaticSchema(message));
  }
}