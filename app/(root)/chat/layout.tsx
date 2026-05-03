"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getRolePath(role: string): "employee" | "hr" | "payroll" | "admin" {
  switch (role) {
    case "ADMIN": return "admin";
    case "HR_OFFICER": return "hr";
    case "PAYROLL_OFFICER": return "payroll";
    default: return "employee";
  }
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [user, loading, router]);

  if (loading || !ready || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-outline-variant border-t-primary-container rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  const sidebarRole = getRolePath(user.role);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={sidebarRole} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
