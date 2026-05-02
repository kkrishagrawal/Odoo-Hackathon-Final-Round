"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Fetcher
async function fetchPayrun() {
  const res = await fetch("/api/payrun");
  if (!res.ok) throw new Error("Failed to fetch payrun");
  return res.json();
}

// Component
export default function PayrunTab() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ["payrun"],
    queryFn: fetchPayrun,
  });

  const payslips = data?.payslips || [];

  // Mutations
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payrun/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });
      if (!res.ok) throw new Error("Failed to generate payrun");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrun"] });
    },
  });

  const computeMutation = useMutation({
    mutationFn: async () => {
      if (!data?.id) return;
      const res = await fetch("/api/payrun/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrunId: data.id }),
      });
      if (!res.ok) throw new Error("Failed to compute payrun");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payrun"] });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      if (!data?.id) return;
      const res = await fetch("/api/payrun/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrunId: data.id }),
      });
      if (!res.ok) throw new Error("Failed to validate payrun");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payrun"] });
      toast.success(`${data.validatedCount} payslip(s) validated`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!data?.id) return;
      const res = await fetch("/api/payrun/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrunId: data.id }),
      });
      if (!res.ok) throw new Error("Failed to cancel payrun");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payrun"] });
      toast.success(`${data.cancelledCount} payslip(s) cancelled`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // UI
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {/* Month selector */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", {
                  month: "short",
                })}
              </option>
            ))}
          </select>

          {/* Year selector */}
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded px-2 py-1 w-20"
            min={2000}
            max={2100}
          />

          {/* Buttons */}
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-primary-container text-white"
          >
            {generateMutation.isPending ? "Creating..." : "New Payrun"}
          </Button>

          <Button
            onClick={() => computeMutation.mutate()}
            disabled={!data?.id || computeMutation.isPending}
            className="bg-primary-container text-white"
          >
            {computeMutation.isPending ? "Computing..." : "Compute"}
          </Button>

          <Button
            onClick={() => validateMutation.mutate()}
            disabled={!data?.id || validateMutation.isPending}
            className="bg-primary-container text-white"
          >
            {validateMutation.isPending ? "Validating..." : "Validate"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="flex gap-6 text-sm">
          <SummaryItem label="Employer Cost" value={sum(payslips, "employerCost")} />
          <SummaryItem label="Gross" value={sum(payslips, "grossWage")} />
          <SummaryItem label="Net" value={sum(payslips, "netWage")} />
        </div>
      )}

      {/* Table */}
      <div className="border rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pay Period</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Employer Cost</TableHead>
              <TableHead>Basic Wage</TableHead>
              <TableHead>Gross Wage</TableHead>
              <TableHead>Net Wage</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7}>Loading...</TableCell>
              </TableRow>
            )}

            {!isLoading && payslips.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>No payslips found</TableCell>
              </TableRow>
            )}

            {payslips.map((p: any) => (
              <TableRow
                key={p.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/admin/payroll/payrun/${p.id}`)}
              >
                <TableCell>
                  {formatPeriod(data.month, data.year)}
                </TableCell>
                <TableCell>{p.user.name}</TableCell>
                <TableCell>₹ {p.employerCost}</TableCell>
                <TableCell>₹ {p.basicSalary}</TableCell>
                <TableCell>₹ {p.grossWage}</TableCell>
                <TableCell>₹ {p.netWage}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helpers
function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">₹ {value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "secondary",
    COMPUTED: "default",
    VALIDATED: "default",
    CANCELLED: "destructive",
  };

  return <Badge variant={map[status] as any}>{status}</Badge>;
}

function sum(items: any[], key: string) {
  return items.reduce((acc, i) => acc + Number(i[key] || 0), 0);
}

function formatPeriod(month: number, year: number) {
  if (!month || !year) return "-";
  return new Date(year, month - 1).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });
}