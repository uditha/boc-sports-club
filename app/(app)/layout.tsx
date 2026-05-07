import { Toaster } from "sonner";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { auth } from "@/auth";
import { isSuperAdmin, getPendingResultsCount } from "@/lib/auth-helpers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userName = session?.user?.name ?? "User";
  const userRole = (session?.user as { role?: string })?.role ?? "";

  const pendingCount = isSuperAdmin(userRole) ? await getPendingResultsCount() : 0;

  return (
    <div className="min-h-full bg-brand-bg">
      <Sidebar userRole={userRole} pendingCount={pendingCount} />
      <Topbar userName={userName} />
      <main className="ml-60 pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
