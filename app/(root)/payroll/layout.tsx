import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background-custom overflow-hidden">
      <Sidebar role="payroll" />
      <main className="flex-1 flex flex-col bg-surface-bright overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
