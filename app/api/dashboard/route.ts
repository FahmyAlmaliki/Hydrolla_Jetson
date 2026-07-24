import { NextResponse } from "next/server";
import { getDashboardData } from "@/app/lib/dataService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range");
  const validRanges = ["30m", "1h", "6h", "24h", "7d", "30d"];
  const chartRange = validRanges.includes(rangeParam as string)
    ? (rangeParam as any)
    : "24h";

  const data = await getDashboardData(chartRange);
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}