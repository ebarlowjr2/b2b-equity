import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppShell from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
