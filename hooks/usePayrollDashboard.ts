import { useQuery } from "@tanstack/react-query";

export type ChartView = "monthly" | "annually";

export interface PayrollDashboardData {
  warnings: {
    missingBank: number;
    missingManager: number;
  };
  recentPayruns: {
    id: string;
    month: number;
    year: number;
    status: string;
    payslipCount: number;
  }[];
  chartData: {
    label: string;
    employerCost: number;
    employeeCount: number;
  }[];
  chartView: ChartView;
}

async function fetchPayrollDashboard(chartView: ChartView): Promise<PayrollDashboardData> {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem("companyId") || "cmoo5tzca00020cu1yq9v6fso" : "cmoo5tzca00020cu1yq9v6fso";
  const res = await fetch(`/api/payroll/dashboard?chartView=${chartView}`, {
    headers: {
      "x-company-id": companyId,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch payroll dashboard");
  return res.json();
}

export function usePayrollDashboard(chartView: ChartView) {
  return useQuery({
    queryKey: ["payroll", "dashboard", chartView],
    queryFn: () => fetchPayrollDashboard(chartView),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}