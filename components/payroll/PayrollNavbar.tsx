"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function PayrollNavbar() {
  const pathname = usePathname();

  const tabs = [
    { name: "Dashboard", href: "/admin/payroll/dashboard" },
    { name: "Payrun", href: "/admin/payroll/payrun" },
    { name: "Configuration", href: "/admin/payroll/config" },
  ];

  return (
    <div className="border-b bg-white px-6 py-3 flex gap-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "text-sm font-medium flex items-center gap-3 px-3 py-3 rounded-lg font-body-md transition-all duration-200",
              isActive
                ? "bg-primary-container text-white shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container"
            )}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}