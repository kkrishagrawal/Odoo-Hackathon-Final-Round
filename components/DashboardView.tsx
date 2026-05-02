"use client";

import React, { Suspense } from "react";
import EmployeeCard, { EmployeeStatus } from "@/components/EmployeeCard";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";

const mockEmployees = [
  { id: 1, name: "Alice Johnson", role: "Software Engineer", status: "present" as EmployeeStatus },
  { id: 2, name: "Bob Smith", role: "Product Manager", status: "leave" as EmployeeStatus },
  { id: 3, name: "Charlie Davis", role: "UX Designer", status: "absent" as EmployeeStatus },
  { id: 4, name: "Diana Prince", role: "HR Manager", status: "present" as EmployeeStatus },
  { id: 5, name: "Evan Wright", role: "QA Engineer", status: "present" as EmployeeStatus },
  { id: 6, name: "Fiona Gallagher", role: "Data Analyst", status: "leave" as EmployeeStatus },
  { id: 7, name: "George Miller", role: "Backend Developer", status: "present" as EmployeeStatus },
  { id: 8, name: "Hannah Lee", role: "Frontend Developer", status: "absent" as EmployeeStatus },
  { id: 9, name: "Ian Clark", role: "DevOps Engineer", status: "present" as EmployeeStatus },
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const query = searchParams?.get("q")?.toLowerCase() || "";

  const filteredEmployees = mockEmployees.filter(
    (emp) => 
      emp.name.toLowerCase().includes(query) || 
      emp.role.toLowerCase().includes(query) ||
      emp.status.toLowerCase().includes(query)
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-h1 font-bold text-on-background">Employees Dashboard</h1>
        <p className="text-on-surface-variant font-body-md mt-1">Overview of your team's status and availability.</p>
      </div>
      
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => (
            <Link 
              key={emp.id} 
              href={`/${pathname?.split('/')[1] || "admin"}/employees/${emp.id}`}
              className="block hover:-translate-y-1 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary-container rounded-2xl"
            >
              <EmployeeCard
                name={emp.name}
                role={emp.role}
                status={emp.status}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-6xl text-outline opacity-50 mb-4">search_off</span>
          <h2 className="text-xl font-h2 text-on-surface mb-2">No employees found</h2>
          <p className="text-on-surface-variant font-body-md">We couldn't find anyone matching "{query}".</p>
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
