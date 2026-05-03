"use client";

import Sidebar from "@/components/Sidebar";
import EmVoice from "@/components/EmVoice";
import { RoleGuard } from "@/components/auth/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard segment="admin">
      <div className="flex h-screen overflow-hidden">
        <Sidebar role="admin" />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto relative">
            {children}
            <EmVoice />
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
