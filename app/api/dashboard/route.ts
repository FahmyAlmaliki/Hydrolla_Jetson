import { NextResponse } from "next/server";
import { getDashboardData } from "@/app/lib/dataService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range");
  const chartRange = rangeParam === "6h" || rangeParam === "24h" || rangeParam === "7d" || rangeParam === "30d"
    ? rangeParam
    : "24h";

  const data = await getDashboardData(chartRange);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}