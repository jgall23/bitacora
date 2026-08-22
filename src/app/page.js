import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { user, profile } = await getUserAndProfile();

  if (!user) redirect("/login");

  if (profile?.rol === "mantenedor" || profile?.rol === "admin") {
    redirect("/dashboard");
  }

  redirect("/bitacoras");
}