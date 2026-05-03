import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SalaryInfoData {
  userId: string;
  monthlyWage: number;
  workingDaysPerWeek: number;
  breakTimeHrs: number;
  basicSalaryPct: number;
  hraPct: number;
  standardAllowance: number;
  bonusPct: number;
  ltaPct: number;
  pfEmployeePctOverride?: number;
}

async function fetchSalaryInfo(userId: string): Promise<{ salaryInfo: SalaryInfoData | null }> {
  const res = await fetch(`/api/user/salary?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch salary info");
  return res.json();
}

async function saveSalaryInfo(data: Partial<SalaryInfoData> & { userId: string }): Promise<{ salaryInfo: SalaryInfoData }> {
  console.log("Saving salary info:", JSON.stringify(data, null, 2));
  const res = await fetch("/api/user/salary", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save salary info");
  return res.json();
}

export function useSalaryInfo(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["salaryInfo", userId],
    queryFn: () => fetchSalaryInfo(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveSalaryInfo(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SalaryInfoData>) =>
      saveSalaryInfo({ userId: userId!, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaryInfo", userId] });
    },
  });
}