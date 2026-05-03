"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const PDFDownloadLinkDynamic = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

// 👉 You must create this (same style as PayslipPDF)
import { SalaryStatementPDF } from "@/components/payroll/SalaryStatementPDF";

interface Employee {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userId, setUserId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch employees
  useEffect(() => {
    fetch("/api/users") // 👈 you likely already have this
      .then((res) => res.json())
      .then(setEmployees)
      .catch(console.error);
  }, []);

  // Fetch report
  const fetchReport = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/salary-statement?userId=${userId}&year=${year}`
      );

      if (!res.ok) throw new Error("Failed");

      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Salary Statement Report</h1>

      {/* Controls */}
      <div className="flex gap-4">
        <select
          className="border px-3 py-2 rounded"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        <select
          className="border px-3 py-2 rounded"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {[2023, 2024, 2025, 2026].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <Button onClick={fetchReport} disabled={!userId || loading}>
          {loading ? "Loading..." : "Generate"}
        </Button>
      </div>

      {/* Preview */}
      {data && (
        <div className="border rounded p-4 space-y-4">
          <div>
            <p><strong>Employee:</strong> {data.employeeName}</p>
            <p><strong>Company:</strong> {data.companyName}</p>
            <p><strong>Year:</strong> {data.year}</p>
          </div>

          <div>
            <p><strong>Net Salary:</strong> ₹{data.totals.net}</p>
          </div>

          {/* Print */}
          <PDFDownloadLinkDynamic
            document={<SalaryStatementPDF {...data} />}
            fileName={`salary_statement_${data.employeeName}_${data.year}.pdf`}
          >
            {({ loading }) => (
              <Button variant="outline">
                {loading ? "Preparing…" : "Print PDF"}
              </Button>
            )}
          </PDFDownloadLinkDynamic>
        </div>
      )}
    </div>
  );
}