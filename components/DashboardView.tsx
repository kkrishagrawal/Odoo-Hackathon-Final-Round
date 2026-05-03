"use client";

import React, { Suspense, useEffect, useState } from "react";
import EmployeeCard, { EmployeeStatus } from "@/components/EmployeeCard";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, getRolePath } from "@/components/auth/AuthContext";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  jobPosition: string | null;
  status: string;
  profilePicUrl: string | null;
}

/** Map DB attendance status to card status */
function mapStatus(dbStatus: string): EmployeeStatus {
  switch (dbStatus) {
    case "IN_OFFICE": return "present";
    case "ON_LEAVE": return "leave";
    case "ABSENT":
    default: return "absent";
  }
}

/** Map DB role enum to display text */
function mapRole(dbRole: string, jobPosition: string | null, department: string | null): string {
  if (jobPosition) return jobPosition;
  switch (dbRole) {
    case "ADMIN": return "Admin";
    case "HR_OFFICER": return "HR Officer";
    case "PAYROLL_OFFICER": return "Payroll Officer";
    case "EMPLOYEE": return department ? `Employee • ${department}` : "Employee";
    default: return dbRole;
  }
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();
  const query = searchParams?.get("q")?.toLowerCase() || "";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) return;

    fetch(`/api/employees?companyId=${user.companyId}`)
      .then(res => res.json())
      .then(data => {
        if (data.employees) {
          setEmployees(data.employees);
        }
      })
      .catch(err => console.error("Failed to fetch employees:", err))
      .finally(() => setLoading(false));
  }, [user?.companyId]);

  const filteredEmployees = employees.filter(
    (emp) => 
      emp.name.toLowerCase().includes(query) || 
      (emp.role || "").toLowerCase().includes(query) ||
      (emp.department || "").toLowerCase().includes(query) ||
      (emp.jobPosition || "").toLowerCase().includes(query) ||
      mapStatus(emp.status).toLowerCase().includes(query)
  );

  const currentRole = user ? getRolePath(user.role) : "admin";
  const isEmployeeRole = currentRole === "employee";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-h1 font-bold text-on-background">Employees Dashboard</h1>
        <p className="text-on-surface-variant font-body-md mt-1">Overview of your team&apos;s status and availability.</p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-5 flex flex-col items-center shadow-sm animate-pulse">
              <div className="w-24 h-24 rounded-2xl bg-surface-container-low mb-4" />
              <div className="w-32 h-5 bg-surface-container-low rounded mb-2" />
              <div className="w-24 h-4 bg-surface-container-low rounded" />
            </div>
          ))}
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => {
            const displayRole = mapRole(emp.role, emp.jobPosition, emp.department);
            const displayStatus = mapStatus(emp.status);
            
            const card = (
              <EmployeeCard
                id={emp.id}
                name={emp.name}
                role={displayRole}
                status={displayStatus}
                avatarUrl={emp.profilePicUrl || undefined}
              />
            );

            if (isEmployeeRole) {
              return (
                <div key={emp.id} className="block">
                  {card}
                </div>
              );
            }

            return (
              <Link 
                key={emp.id} 
                href={`/${currentRole}/employees/${emp.id}`}
                className="block hover:-translate-y-1 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container rounded-2xl"
              >
                {card}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-6xl text-outline opacity-50 mb-4">search_off</span>
          <h2 className="text-xl font-h2 text-on-surface mb-2">No employees found</h2>
          <p className="text-on-surface-variant font-body-md">
            {query ? `We couldn't find anyone matching "${query}".` : "No employees in your company yet."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardView() {
  return (
    <Suspense fallback={<div className="p-8">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
