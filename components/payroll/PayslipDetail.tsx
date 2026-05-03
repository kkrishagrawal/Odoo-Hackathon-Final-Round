"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PayslipPrintButton } from "./PayslipPrintButton";

// Types

interface PayslipDetail {
    id: string;
    status: string;
    salaryStructure: string;
    attendanceDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    totalPayableDays: number;
    monthlyWage: number;
    basicSalary: number;
    hra: number;
    standardAllowance: number;
    bonus: number;
    lta: number;
    fixedAllowance: number;
    grossWage: number;
    pfEmployee: number;
    pfEmployer: number;
    professionalTax: number;
    tdsDeduction: number;
    totalDeductions: number;
    netWage: number;
    employerCost: number;
    validatedAt: string | null;
    payrun: { month: number; year: number };
    user: {
        id: string;
        name: string;
        department: string | null;
        location: string | null;
        dateOfJoining: string | null;
        salaryInfo: { workingDaysPerWeek: number } | null;
        bankDetails: {
            panNumber: string;
            uanNumber: string | null;
            accountNumber: string;
            employeeCode: string;
        } | null;
        company: { name: string; logoUrl: string | null };
    };
}

// Helpers

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmt(n: number) {
    return new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6, // show full precision like the mockup
    }).format(n);
}

function lastDay(month: number, year: number) {
    return new Date(year, month, 0).getDate();
}

async function postAction(payslipId: string, action: "compute" | "validate" | "cancel") {
    const res = await fetch(`/api/payroll/payslip/${payslipId}/${action}`, {
        method: "POST",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Failed to ${action}`);
    }
    return res.json();
}

// Main Component

interface Props {
    payslipId: string | null;
}

function countWorkingDays(year: number, month: number) {
    const days = new Date(year, month, 0).getDate();
    let count = 0;

    for (let d = 1; d <= days; d++) {
        const dow = new Date(year, month - 1, d).getDay();
        if (dow !== 0 && dow !== 6) count++; // exclude weekends
    }

    return count;
}

function getUnpaidLeaveAmount(
    p: any,
    month: number,
    year: number
) {
    const totalWorkingDays = countWorkingDays(year, month);

    const payableDays = (p.attendanceDays || 0) + (p.paidLeaveDays || 0);

    if (!payableDays || !totalWorkingDays) return 0;

    // reverse scaling
    const fullGross =
        p.grossWage * (totalWorkingDays / payableDays);

    const perDay = fullGross / totalWorkingDays;

    return Math.round(perDay * (p.unpaidLeaveDays || 0));
}

export default function PayslipDetail({ payslipId }: Props) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<{ payslip: PayslipDetail }>({
        queryKey: ["payslip", payslipId],
        queryFn: async () => {
            const res = await fetch(`/api/payroll/payslip/${payslipId}`);
            if (!res.ok) throw new Error("Failed to fetch payslip");
            return res.json();
        },
        enabled: !!payslipId,
        staleTime: 1000 * 30,
    });

    const p = data?.payslip;

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["payslip", payslipId] });
        queryClient.invalidateQueries({ queryKey: ["payrun"] });
    };

    // Replace the makeMutation function + three calls with:
    const compute = useMutation({
        mutationFn: () => postAction(payslipId!, "compute"),
        onSuccess: () => { invalidate(); toast.success("Payslip computed"); },
        onError: (e: Error) => toast.error(e.message),
    });
    const validate = useMutation({
        mutationFn: () => postAction(payslipId!, "validate"),
        onSuccess: () => { invalidate(); toast.success("Payslip validated"); },
        onError: (e: Error) => toast.error(e.message),
    });
    const cancel = useMutation({
        mutationFn: () => postAction(payslipId!, "cancel"),
        onSuccess: () => { invalidate(); toast.success("Payslip cancelled"); },
        onError: (e: Error) => toast.error(e.message),
    });

    const busy = compute.isPending || validate.isPending || cancel.isPending;

    return (
        <div className="max-w-3xl mx-auto py-6">
            {isLoading || !p ? (
                <div className="p-8 animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-48" />
                    <div className="h-4 bg-muted rounded w-72" />
                    <div className="h-40 bg-muted rounded w-full" />
                </div>
            ) : (
                <div className="p-6 space-y-5">
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                                /* New Payslip — handled at parent level */
                                toast.info("Use the New Payrun button to generate a new payslip");
                            }}
                        >
                            New Payslip
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || p.status === "VALIDATED" || p.status === "CANCELLED"}
                            onClick={() => compute.mutate()}
                        >
                            {compute.isPending ? "Computing…" : "Compute"}
                        </Button>
                        <Button
                            size="sm"
                            disabled={busy || p.status !== "COMPUTED"}
                            className="bg-[#A463B0] hover:bg-[#8A5294] text-white"
                            onClick={() => validate.mutate()}
                        >
                            {validate.isPending ? "Validating…" : "Validate"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || p.status === "VALIDATED" || p.status === "CANCELLED"}
                            className="text-destructive border-destructive hover:bg-destructive/10"
                            onClick={() => cancel.mutate()}
                        >
                            {cancel.isPending ? "Cancelling…" : "Cancel"}
                        </Button>
                        <PayslipPrintButton
                            disabled={p.status !== "VALIDATED"}
                            data={{
                                companyName: p.user.company.name,
                                companyLogoUrl: p.user.company.logoUrl,
                                month: p.payrun.month,
                                year: p.payrun.year,
                                employeeName: p.user.name,
                                employeeCode: p.user.bankDetails?.employeeCode ?? null,
                                department: p.user.department,
                                location: p.user.location,
                                dateOfJoining: p.user.dateOfJoining
                                    ? new Date(p.user.dateOfJoining).toLocaleDateString("en-IN")
                                    : null,
                                panNumber: p.user.bankDetails?.panNumber ?? null,
                                uanNumber: p.user.bankDetails?.uanNumber ?? null,
                                bankAccountNumber: p.user.bankDetails?.accountNumber ?? null,
                                payPeriod: `1/${p.payrun.month}/${p.payrun.year} to ${lastDay(p.payrun.month, p.payrun.year)}/${p.payrun.month}/${p.payrun.year}`,
                                payDate: p.validatedAt
                                    ? new Date(p.validatedAt).toLocaleDateString("en-IN")
                                    : new Date().toLocaleDateString("en-IN"),
                                attendanceDays: p.attendanceDays,
                                paidLeaveDays: p.paidLeaveDays,
                                totalPayableDays: p.totalPayableDays,
                                workingDaysPerWeek: p.user.salaryInfo?.workingDaysPerWeek ?? 5,
                                basicSalary: p.basicSalary,
                                hra: p.hra,
                                standardAllowance: p.standardAllowance,
                                bonus: p.bonus,
                                lta: p.lta,
                                fixedAllowance: p.fixedAllowance,
                                grossWage: p.grossWage,
                                pfEmployee: p.pfEmployee,
                                pfEmployer: p.pfEmployer,
                                professionalTax: p.professionalTax,
                                tdsDeduction: p.tdsDeduction,
                                unpaidLeaveDeduction: getUnpaidLeaveAmount(
                                    p,
                                    p.payrun.month,
                                    p.payrun.year
                                ),
                                totalDeductions: p.totalDeductions,
                                netWage: p.netWage,
                            }}
                        />
                    </div>

                    {/* Employee Header */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-on-surface">{p.user.name}</h2>

                        <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
                            <span className="text-on-surface-variant font-medium">Payrun</span>
                            <span className="text-[#A463B0] font-medium">
                                {MONTHS[p.payrun.month - 1]} {p.payrun.year}
                            </span>

                            <span className="text-on-surface-variant font-medium">Salary Structure</span>
                            <span className="text-[#A463B0]">{p.salaryStructure}</span>

                            <span className="text-on-surface-variant font-medium">Period</span>
                            <span className="text-on-surface">
                                01 {MONTHS[p.payrun.month - 1]} To{" "}
                                {lastDay(p.payrun.month, p.payrun.year)} {MONTHS[p.payrun.month - 1]}
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="worked">
                        <TabsList className="border-b border-border rounded-none bg-transparent h-auto p-0 gap-0 w-full justify-start">
                            <TabsTrigger
                                value="worked"
                                className="rounded-t-md rounded-b-none border border-b-0 border-border px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=inactive]:bg-muted"
                            >
                                Worked Days
                            </TabsTrigger>
                            <TabsTrigger
                                value="salary"
                                className="rounded-t-md rounded-b-none border border-b-0 border-border px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=inactive]:bg-muted ml-1"
                            >
                                Salary Computation
                            </TabsTrigger>
                        </TabsList>

                        {/* Worked Days Tab */}
                        <TabsContent value="worked" className="border border-t-0 border-border rounded-b-md p-0 mt-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead>Type</TableHead>
                                        <TableHead>Days</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Attendance row */}
                                    <TableRow>
                                        <TableCell>Attendance</TableCell>
                                        <TableCell>
                                            {fmt(p.attendanceDays)}
                                            {p.user.salaryInfo && (
                                                <span className="text-muted-foreground text-xs ml-2">
                                                    ({p.user.salaryInfo.workingDaysPerWeek} working days in week)
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ₹ {fmt(attendanceAmount(p))}
                                        </TableCell>
                                    </TableRow>

                                    {/* Paid Time Off row */}
                                    {p.paidLeaveDays > 0 && (
                                        <TableRow>
                                            <TableCell>Paid Time off</TableCell>
                                            <TableCell>
                                                {fmt(p.paidLeaveDays)}
                                                <span className="text-muted-foreground text-xs ml-2">
                                                    ({p.paidLeaveDays} Paid leaves/Month)
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                ₹ {fmt(paidLeaveAmount(p))}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Unpaid row */}
                                    {p.unpaidLeaveDays > 0 && (
                                        <TableRow className="text-muted-foreground">
                                            <TableCell>Unpaid Leave</TableCell>
                                            <TableCell>{fmt(p.unpaidLeaveDays)}</TableCell>
                                            <TableCell className="text-right">₹ {fmt(getUnpaidLeaveAmount(p, p.payrun.month, p.payrun.year))}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Totals row */}
                                    <TableRow className="border-t-2 border-border">
                                        <TableCell />
                                        <TableCell className="font-semibold">
                                            {fmt(p.totalPayableDays)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            ₹ {fmt(p.grossWage)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TabsContent>

                        {/* Salary Computation Tab */}
                        <TabsContent value="salary" className="border border-t-0 border-border rounded-b-md p-0 mt-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead>Rule</TableHead>
                                        <TableHead className="text-right">Description</TableHead>
                                        <TableHead className="text-right">Amount (₹)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Earnings section */}
                                    <TableRow className="bg-muted/20">
                                        <TableCell colSpan={3} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-1.5">
                                            Earnings
                                        </TableCell>
                                    </TableRow>
                                    <SalaryRow label="Basic Salary" rate="50% of Monthly Wage" amount={p.basicSalary} />
                                    <SalaryRow label="HRA" rate="50% of Basic" amount={p.hra} />
                                    <SalaryRow label="Standard Allowance" rate="Fixed" amount={p.standardAllowance} />
                                    <SalaryRow label="Bonus" rate="8.33% of Basic" amount={p.bonus} />
                                    <SalaryRow label="Leave Travel Allow." rate="8.33% of Basic" amount={p.lta} />
                                    <SalaryRow label="Fixed Allowance" rate="Residual" amount={p.fixedAllowance} />
                                    <TableRow className="font-semibold border-t border-border">
                                        <TableCell>Gross Wage</TableCell>
                                        <TableCell />
                                        <TableCell className="text-right">₹ {fmt(p.grossWage)}</TableCell>
                                    </TableRow>

                                    {/* Deductions section */}
                                    <TableRow className="bg-muted/20">
                                        <TableCell colSpan={3} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-1.5">
                                            Deductions
                                        </TableCell>
                                    </TableRow>
                                    <SalaryRow label="PF (Employee)" rate="12% of Basic" amount={p.pfEmployee} negative />
                                    <SalaryRow label="PF (Employer)" rate="12% of Basic" amount={p.pfEmployer} negative />
                                    <SalaryRow label="Professional Tax" rate="Fixed ₹200" amount={p.professionalTax} negative />
                                    {p.tdsDeduction > 0 && (
                                        <SalaryRow label="TDS Deduction" rate="—" amount={p.tdsDeduction} negative />
                                    )}
                                    {p.unpaidLeaveDays > 0 && (
                                        <SalaryRow
                                            label="Unpaid Leave Deduction"
                                            rate={`${fmt(p.unpaidLeaveDays)} days`}
                                            amount={getUnpaidLeaveAmount(p, p.payrun.month, p.payrun.year)}
                                            negative
                                        />
                                    )}

                                    {/* Net */}
                                    <TableRow className="font-bold border-t-2 border-border">
                                        <TableCell>Net Wage</TableCell>
                                        <TableCell />
                                        <TableCell className="text-right">₹ {fmt(p.netWage)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}

// Sub-components

function SalaryRow({
    label, rate, amount, negative = false,
}: {
    label: string; rate: string; amount: number; negative?: boolean;
}) {
    return (
        <TableRow>
            <TableCell>{label}</TableCell>
            <TableCell className="text-right text-muted-foreground text-sm">{rate}</TableCell>
            <TableCell className={`text-right ${negative ? "text-destructive" : ""}`}>
                {negative ? "− " : ""}₹ {fmt(Math.abs(amount))}
            </TableCell>
        </TableRow>
    );
}

// Amount calculations
// Split gross proportionally between attendance and paid leave days

function attendanceAmount(p: PayslipDetail): number {
    const total = p.attendanceDays + p.paidLeaveDays;
    if (total === 0) return 0;
    return (p.attendanceDays / total) * p.grossWage;
}

function paidLeaveAmount(p: PayslipDetail): number {
    const total = p.attendanceDays + p.paidLeaveDays;
    if (total === 0) return 0;
    return (p.paidLeaveDays / total) * p.grossWage;
}