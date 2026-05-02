"use client";

import useSWR from "swr";
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PayrunPage() {
  const { data, isLoading } = useSWR("/api/payrun", fetcher);

  const payslips = data?.payslips || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button className="flex items-center gap-3 px-3 py-3 rounded-lg font-body-md transition-all duration-200 bg-primary-container text-white shadow-md">Payrun</Button>
          <Button className="flex items-center gap-3 px-3 py-3 rounded-lg font-body-md transition-all duration-200 bg-primary-container text-white shadow-md">Validate</Button>
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-muted-foreground">Employer Cost</p>
            <p className="font-semibold">
              ₹ {sum(payslips, "employerCost")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Gross</p>
            <p className="font-semibold">
              ₹ {sum(payslips, "grossWage")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Net</p>
            <p className="font-semibold">
              ₹ {sum(payslips, "netWage")}
            </p>
          </div>
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
                <TableCell colSpan={7}>
                  No payslips found
                </TableCell>
              </TableRow>
            )}

            {payslips.map((p: any) => (
              <TableRow key={p.id}>
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
  return `[${new Date(year, month - 1).toLocaleString("default", {
    month: "short",
  })} ${year}]`;
}