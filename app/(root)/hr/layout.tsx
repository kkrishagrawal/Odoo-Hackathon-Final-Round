"use client";

import Sidebar from "@/components/Sidebar";
import EmVoice from "@/components/EmVoice";
import TopBar from "@/components/TopBar";
import { RoleGuard } from "@/components/auth/AuthContext";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard segment="hr">
      <div className="flex h-screen overflow-hidden">
        <Sidebar role="hr" />
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto relative">
            {children}
            <EmVoice />
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
