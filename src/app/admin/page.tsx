import { cookies } from "next/headers";
import { getAdminDashboardInitialData } from "@/app/actions/mess";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const savedMonthCookie = cookieStore.get("adminSelectedMonth");
  
  const d = new Date();
  const defaultMonthYear = `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  
  const monthToLoad = savedMonthCookie?.value || defaultMonthYear;
  const hasSelectedMonth = !!savedMonthCookie;

  // Pre-fetch the data on the server!
  const initialData = await getAdminDashboardInitialData(monthToLoad, "");

  return (
    <AdminClient 
      initialServerData={initialData} 
      initialMonth={monthToLoad} 
      initialHasSelectedMonth={hasSelectedMonth} 
    />
  );
}
