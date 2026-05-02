import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PayrollConfigData {
  pfEmployeePct: number;
  pfEmployerPct: number;
  professionalTax: number;
}

async function fetchPayrollConfig(): Promise<{ config: PayrollConfigData | null }> {
  const res = await fetch("/api/payroll/config");
  if (!res.ok) throw new Error("Failed to fetch payroll config");
  return res.json();
}

async function savePayrollConfig(data: PayrollConfigData): Promise<{ config: PayrollConfigData }> {
  const res = await fetch("/api/payroll/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
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