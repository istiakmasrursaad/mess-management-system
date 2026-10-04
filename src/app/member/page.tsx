import { getMessData } from "@/app/actions/mess";
import { getSession } from "@/app/actions/auth";
import MemberClient from "./MemberClient";

export default async function MemberPage() {
  // Pre-fetch the data on the server!
  const [initialData, initialSession] = await Promise.all([
    getMessData(),
    getSession()
  ]);

  return (
    <MemberClient 
      initialServerData={initialData} 
      initialSession={initialSession}
    />
  );
}
