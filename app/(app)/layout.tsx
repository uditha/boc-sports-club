import { Toaster } from "sonner";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { auth } from "@/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userName = session?.user?.name ?? "User";

  return (
    <div className="min-h-full bg-brand-bg">
      <Sidebar />
      <Topbar userName={userName} />
      <main className="ml-60 pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
