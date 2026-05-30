import { getDashboardData } from "@/app/lib/dataService";
import DashboardAutoRefresh from "@/app/components/DashboardAutoRefresh";

// Refresh data setiap 10 detik (Next.js ISR / revalidate)
export const revalidate = 10;

export default async function DashboardPage() {
  const initialData = await getDashboardData();
  return <DashboardAutoRefresh initialData={initialData} />;
}
