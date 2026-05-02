"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Role = "employee" | "hr" | "payroll" | "admin";

interface SidebarProps {
  role: Role;
}

const roleMenus = {
  employee: [
    { name: "Dashboard", path: "/employee/dashboard", icon: "dashboard" },
    { name: "Attendance", path: "/employee/attendance", icon: "calendar_today" },
    { name: "Time Off", path: "/employee/leave", icon: "event_busy" },
    { name: "My Profile", path: "/employee/profile", icon: "person" },
  ],
  hr: [
    { name: "Employees", path: "/hr/dashboard", icon: "group" },
    { name: "Attendance", path: "/hr/attendance", icon: "calendar_month" },
    { name: "Time Off", path: "/hr/leave", icon: "event_busy" },
    { name: "Reports", path: "/hr/report", icon: "bar_chart" },
    { name: "Settings", path: "/hr/settings", icon: "settings" },
  ],
  payroll: [
    { name: "Employees", path: "/payroll/dashboard", icon: "group" },
    { name: "Attendance", path: "/payroll/attendance", icon: "calendar_month" },
    { name: "Time Off", path: "/payroll/leave", icon: "event_busy" },
    { name: "Payroll", path: "/payroll/payroll", icon: "payments" },
  ],
  admin: [
    { name: "Employees", path: "/admin/dashboard", icon: "group" },
    { name: "Attendance", path: "/admin/attendance", icon: "calendar_month" },
    { name: "Time Off", path: "/admin/leave", icon: "event_busy" },
    { name: "Payroll", path: "/admin/payroll", icon: "payments" },
    { name: "Reports", path: "/admin/report", icon: "bar_chart" },
    { name: "Settings", path: "/admin/settings", icon: "settings" },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = roleMenus[role] || [];

  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 h-screen flex flex-col sticky top-0 shadow-[4px_0_24px_rgba(113,75,103,0.02)]">
      <div className="h-20 flex items-center px-6 border-b border-outline-variant/20">
        <Link href="/" className="text-2xl font-black tracking-tight text-primary-container font-h1 antialiased">
          EmPay
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <div className="mb-4 px-2">
          <p className="text-xs font-label-md text-outline uppercase tracking-wider">
            {role} Menu
          </p>
        </div>
        
        {menuItems.map((item) => {
          const isActive = pathname?.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg font-body-md transition-all duration-200 ${
                isActive
                  ? "bg-primary-container text-white shadow-md"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container"
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? "text-white" : ""}`}>
                {item.icon}
              </span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline-variant/20">
        <button className="flex items-center gap-3 px-3 py-3 w-full rounded-lg font-body-md text-error hover:bg-error/10 transition-colors">
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
