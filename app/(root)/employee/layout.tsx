"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { RoleGuard } from "@/components/auth/AuthContext";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard segment="employee">
      <div className="flex h-screen overflow-hidden">
        <Sidebar role="employee" />
        <main className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
