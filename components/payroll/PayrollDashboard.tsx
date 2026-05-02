// components/payroll/PayrollDashboard.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CostChart } from "./CostChart";
import { usePayrollDashboard, ChartView } from "@/hooks/usePayrollDashboard";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function PayrollDashboard() {
  const [costChartView, setCostChartView] = useState<ChartView>("monthly");
  const [countChartView, setCountChartView] = useState<ChartView>("monthly");

  // Fetch whichever view is active — two independent queries
  const costQuery = usePayrollDashboard(costChartView);
  const countQuery = usePayrollDashboard(countChartView);

  // Warnings and payruns come from either query (same data regardless of chart toggle)
  const meta = costQuery.data ?? countQuery.data;

  return (
    <div className="space-y-6 p-6">
      {/* ── Row 1: Warnings + Payruns ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Warnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {costQuery.isLoading ? (
              <>
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-48" />
              </>
            ) : meta?.warnings ? (
              <>
                {meta.warnings.missingBank > 0 && (
                  <p className="text-sm text-blue-600">
                    {meta.warnings.missingBank} Employee{meta.warnings.missingBank > 1 ? "s" : ""} without Bank A/c
                  </p>
                )}
                {meta.warnings.missingManager > 0 && (
                  <p className="text-sm text-blue-600">
                    {meta.warnings.missingManager} Employee{meta.warnings.missingManager > 1 ? "s" : ""} without Manager
                  </p>
                )}
                {meta.warnings.missingBank === 0 && meta.warnings.missingManager === 0 && (
                  <p className="text-sm text-muted-foreground">No warnings</p>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Recent Payruns */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Payrun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {costQuery.isLoading ? (
              <>
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-52" />
              </>
            ) : meta?.recentPayruns.length ? (
              meta.recentPayruns.map((p) => (
                <p key={p.id} className="text-sm text-blue-600 cursor-pointer hover:underline">
                  Payrun for {MONTH_NAMES[p.month - 1]} {p.year} ({p.payslipCount} Payslip{p.payslipCount !== 1 ? "s" : ""})
                </p>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payruns yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 2: Charts ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* Employer Cost Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Employer Cost</CardTitle>
              <ChartViewToggle value={costChartView} onChange={setCostChartView} id="cost" />
            </div>
          </CardHeader>
          <CardContent>
            {costQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : costQuery.data ? (
              <CostChart data={costQuery.data.chartData} mode="employerCost" title="Employer Cost" />
            ) : null}
          </CardContent>
        </Card>

        {/* Employee Count Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Employee Count</CardTitle>
              <ChartViewToggle value={countChartView} onChange={setCountChartView} id="count" />
            </div>
          </CardHeader>
          <CardContent>
            {countQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : countQuery.data ? (
              <CostChart data={countQuery.data.chartData} mode="employeeCount" title="Employee Count" />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Toggle sub-component ──────────────────────────────────────
function ChartViewToggle({
  value,
  onChange,
  id,
}: {
  value: ChartView;
  onChange: (v: ChartView) => void;
  id: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={value === "annually" ? "font-medium text-foreground" : ""}>Annually</span>
      <Switch
        id={`chart-toggle-${id}`}
        checked={value === "monthly"}
        onCheckedChange={(checked) => onChange(checked ? "monthly" : "annually")}
      />
      <Label htmlFor={`chart-toggle-${id}`} className={value === "monthly" ? "font-medium text-foreground" : ""}>
        Monthly
      </Label>
    </div>
  );
}