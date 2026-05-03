"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { useState } from "react";

export type Role = "employee" | "hr" | "payroll" | "admin";

interface SidebarProps {
  role: Role;
}

const roleMenus = {
  employee: [
    { name: "Dashboard", path: "/employee/dashboard", icon: "dashboard" },
    { name: "Attendance", path: "/employee/attendance", icon: "calendar_today" },
    { name: "Time Off", path: "/employee/leave", icon: "event_busy" },
    { name: "Payroll", path: "/employee/payroll", icon: "payments" },
    { name: "Tickets", path: "/employee/tickets", icon: "confirmation_number" },
    { name: "My Profile", path: "/employee/profile", icon: "person" },
  ],
  hr: [
    { name: "Employees", path: "/hr/dashboard", icon: "group" },
    { name: "Attendance", path: "/hr/attendance", icon: "calendar_month" },
    { name: "Time Off", path: "/hr/leave", icon: "event_busy" },
    { name: "Tickets", path: "/hr/tickets", icon: "confirmation_number" },
    { name: "Settings", path: "/hr/settings", icon: "settings" },
  ],
  payroll: [
    { name: "Employees", path: "/payroll/dashboard", icon: "group" },
    { name: "Attendance", path: "/payroll/attendance", icon: "calendar_month" },
    { name: "Time Off", path: "/payroll/leave", icon: "event_busy" },
    { name: "Payroll", path: "/payroll/payroll", icon: "payments" },
    { name: "Reports", path: "/payroll/report", icon: "bar_chart" },
  ],
  admin: [
    { name: "Employees", path: "/admin/dashboard", icon: "group" },
    { name: "Attendance", path: "/admin/attendance", icon: "calendar_month" },
    { name: "Time Off", path: "/admin/leave", icon: "event_busy" },
    { name: "Payroll", path: "/admin/payroll/payroll", icon: "payments" },
    { name: "Tickets", path: "/admin/tickets", icon: "confirmation_number" },
    { name: "Reports", path: "/admin/report", icon: "bar_chart" },
    { name: "Settings", path: "/admin/settings", icon: "settings" },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const menuItems = roleMenus[role] || [];
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-surface-container-lowest border-r border-outline-variant/30 h-screen flex flex-col sticky top-0 shadow-[4px_0_24px_rgba(113,75,103,0.02)] transition-all duration-300 ease-in-out ${collapsed ? "w-[72px]" : "w-64"
        }`}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-outline-variant/20">
        {!collapsed && (
          <Link href="/" className="text-2xl font-black tracking-tight text-primary-container font-h1 antialiased pl-2">
            Em<span className="text-[#7e7574]">Pay</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-lg hover:bg-surface-container-low transition-colors ${collapsed ? "mx-auto" : ""}`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            {collapsed ? "menu" : "menu_open"}
          </span>
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-6 ${collapsed ? "px-2" : "px-4"} space-y-2 overflow-y-auto`}>
        {!collapsed && (
          <div className="mb-4 px-2">
            <p className="text-xs font-label-md text-outline uppercase tracking-wider">
              {role} Menu
            </p>
          </div>
        )}

        {menuItems.map((item) => {
          const isActive = pathname?.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              title={collapsed ? item.name : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-3 rounded-lg font-body-md transition-all duration-200 ${isActive
                  ? "bg-primary-container text-white shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container"
                }`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? "text-white" : ""}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`${collapsed ? "p-2" : "p-4"} border-t border-outline-variant/20 space-y-1`}>
        <Link
          href="/chat"
          title={collapsed ? "EmMCP Chat" : undefined}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-3 w-full rounded-lg font-body-md transition-colors ${pathname === "/chat"
              ? "bg-primary-container text-white"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container"
            }`}
        >
          <span className={`material-symbols-outlined text-xl ${pathname === "/chat" ? "text-white" : ""}`}>smart_toy</span>
          {!collapsed && <span className="font-medium">EmMCP Chat</span>}
        </Link>
        <button
          onClick={() => { logout(); }}
          title={collapsed ? "Logout" : undefined}
          className={`cursor-pointer flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-3 w-full rounded-lg font-body-md text-error hover:bg-error/10 transition-colors`}
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
