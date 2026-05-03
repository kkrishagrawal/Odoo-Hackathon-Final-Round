import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PayrollConfigData {
  pfEmployeePct: number;
  pfEmployerPct: number;
  professionalTax: number;
}

async function fetchPayrollConfig(): Promise<{ config: PayrollConfigData | null }> {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem("companyId") || "cmoo5tzca00020cu1yq9v6fso" : "cmoo5tzca00020cu1yq9v6fso";
  const res = await fetch("/api/payroll/config", {
    headers: {
      "x-company-id": companyId,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch payroll config");
  return res.json();
}

async function savePayrollConfig(data: PayrollConfigData): Promise<{ config: PayrollConfigData }> {
  const companyId = typeof window !== 'undefined' ? localStorage.getItem("company.id") || "cmoo5tzca00020cu1yq9v6fso" : "cmoo5tzca00020cu1yq9v6fso";
  const res = await fetch("/api/payroll/config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-company-id": companyId,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save payroll config");
  return res.json();
}

export function usePayrollConfig() {
  return useQuery({
    queryKey: ["payrollConfig"],
    queryFn: fetchPayrollConfig,
    staleTime: 1000 * 60 * 10,
  });
}

export function useSavePayrollConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePayrollConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrollConfig"] });
    },
  });
}