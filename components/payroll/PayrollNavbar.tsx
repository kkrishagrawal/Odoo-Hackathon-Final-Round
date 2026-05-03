"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAuth, getRolePath } from "@/components/auth/AuthContext"; // adjust path if needed

export default function PayrollNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // fallback to payroll if user not loaded yet
  const basePath =
    user && user.role === "ADMIN"
      ? `/${getRolePath(user.role)}/payroll`
      : "/payroll";
  const tabs = [
    { name: "Payroll Dashboard", href: `${basePath}/payroll` },
    { name: "Payrun", href: `${basePath}/payrun` },
    { name: "Payroll Configuration", href: `${basePath}/config` },
  ];

  return (
    <div className="border-b bg-white px-6 py-3 flex gap-4">
      {tabs.map((tab) => {
        const isActive =
          tab.href === basePath
            ? pathname === basePath
            : pathname.startsWith(tab.href);

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