import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} name={user.name || user.email || "User"} />
      <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">
        {children}
      </div>
      <MobileBottomNav role={user.role} />
    </div>
  );
}
