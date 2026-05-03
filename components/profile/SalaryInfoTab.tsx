"use client";

import { useEffect, useMemo, useState } from "react";
import { useSalaryInfo, useSaveSalaryInfo, SalaryInfoData } from "@/hooks/useSalaryInfo";
import { Button } from "@/components/ui/button";
import { usePayrollConfig } from "@/hooks/usePayrollConfig";
import { useQuery } from "@tanstack/react-query";

interface Props {
    userId: string;
    canEdit: boolean;
}

// Default values matching schema
const DEFAULTS: Omit<SalaryInfoData, "userId"> = {
    monthlyWage: 0,
    workingDaysPerWeek: 5,
    breakTimeHrs: 1,
    basicSalaryPct: 50,
    hraPct: 50,
    standardAllowance: 0,
    bonusPct: 8.33,
    ltaPct: 8.33,
};

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

function formatINR(n: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(n);
}

function BreakdownRow({
    label, value, percent, showPercent = true, editable = false, onEdit,
}: {
    label: string; value: number; percent?: number;
    showPercent?: boolean; editable?: boolean; onEdit?: (v: string) => void;
}) {
    return (
        <div className="grid grid-cols-[1fr_120px_100px] gap-3 items-center">
            <p className="text-sm text-muted-foreground">{label}</p>
            <input
                value={editable ? value : `₹ ${value.toLocaleString("en-IN")}`}
                readOnly={!editable}
                onChange={(e) => onEdit?.(e.target.value)}
                className={`border rounded px-2 py-1 text-sm text-right ${editable ? "bg-background border-outline-variant/50" : "bg-muted"
                    }`}
            />
            {showPercent ? (
                <input value={`${Number(percent ?? 0).toFixed(2)}%`}
                    readOnly
                    className="border rounded px-2 py-1 bg-muted text-sm text-right" />
            ) : <div />}
        </div>
    );
}

export function SalaryInfoTab({ userId, canEdit }: Props) {
    const { data, isLoading } = useSalaryInfo(userId);
    const { data: configData } = usePayrollConfig();
    const config = configData?.config ?? { pfEmployeePct: 12, pfEmployerPct: 12, professionalTax: 200 };

    const save = useSaveSalaryInfo(userId);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<Omit<SalaryInfoData, "userId">>(DEFAULTS);
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const { data: attendanceRecords = [] } = useQuery({
        queryKey: ["attendance", userId, month, year],
        queryFn: async () => {
            const res = await fetch(
                `/api/attendance?userId=${userId}&month=${month}&year=${year}`
            );
            if (!res.ok) throw new Error("Failed to fetch attendance");

            const data = await res.json();

            return data.records || data.attendance || data || [];
        },
    });

    const monthlyBreakMs = useMemo(() => {
        if (!attendanceRecords || attendanceRecords.length === 0) return 0;

        return attendanceRecords.reduce((total: number, record: { breaks: { pausedAt: string; resumedAt: string | null; }[]; }) => {
            const breaks = (record.breaks as { pausedAt: string; resumedAt: string | null }[]) || [];

            const recordBreakMs = breaks.reduce((acc, b) => {
                const start = new Date(b.pausedAt).getTime();
                const end = b.resumedAt ? new Date(b.resumedAt).getTime() : Date.now();
                return acc + (end - start);
            }, 0);

            return total + recordBreakMs;
        }, 0);
    }, [attendanceRecords]);

    const formattedMonthlyBreak = useMemo(() => {
        const totalSec = Math.floor(monthlyBreakMs / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        return `${h}h ${m}m`;
    }, [monthlyBreakMs]);

    // Sync fetched data into form state
    useEffect(() => {
        if (data?.salaryInfo) {
            const { userId: _, ...rest } = data.salaryInfo;
            setForm(rest);
        }
    }, [data]);

    //  Live computations 
    const computed = useMemo(() => {
        const wage = form.monthlyWage;
        const basic = round2((wage * form.basicSalaryPct) / 100);
        const hra = round2((basic * form.hraPct) / 100);
        const stdAllowance = round2(form.standardAllowance);
        const stdAllowancePct = (stdAllowance / wage) * 100;
        const bonus = round2((basic * form.bonusPct) / 100);
        const lta = round2((basic * form.ltaPct) / 100);
        const maxStdAllowance =
            wage - basic - hra - bonus - lta;
        const fixedAllowance = Math.max(
            0,
            wage - basic - hra - stdAllowance - bonus - lta
        );
        const fixedAllowancePct = (fixedAllowance / wage * 100);
        const grossWage = round2(basic + hra + stdAllowance + bonus + lta + fixedAllowance);
        const pfEmployeePct = form.pfEmployeePctOverride ?? config.pfEmployeePct;
        const pfEmployee = round2((basic * pfEmployeePct) / 100);
        const pfEmployer = round2((basic * config.pfEmployerPct) / 100);
        const professionalTax = config.professionalTax;
        const totalDeductions = round2(pfEmployee + pfEmployer + professionalTax);

        const netWage = round2(grossWage - totalDeductions);
        return {
            basic, hra, stdAllowance, bonus, lta, fixedAllowance, fixedAllowancePct,
            grossWage, pfEmployee, pfEmployer, professionalTax, stdAllowancePct,
            totalDeductions, netWage, maxStdAllowance,
            yearlyWage: round2(wage * 12),
        };
    }, [form]);

    const isInvalidStdAllowance = form.standardAllowance > computed.maxStdAllowance;

    const set = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
    };

    const handleSave = async () => {
        await save.mutateAsync(form);
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (data?.salaryInfo) {
            const { userId: _, ...rest } = data.salaryInfo;
            setForm(rest);
        }
        setIsEditing(false);
    };

    //  Shared style helpers (mirrors ProfileView) 
    const inputClass = (editable = true) =>
        `flex-1 bg-transparent border-b py-1 focus:outline-none text-on-surface text-sm ${isEditing && editable
            ? "border-outline-variant/50 focus:border-primary-container"
            : "border-transparent"
        }`;

    const readonlyInput = "flex-1 bg-transparent border-b border-transparent py-1 text-on-surface text-sm focus:outline-none";

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-surface-container-low rounded w-full" />
                ))}
            </div>
        );
    }

    const pfEmployeePct = form.pfEmployeePctOverride ?? config.pfEmployeePct;
    const isInvalidPf = pfEmployeePct < 12;

    return (
        <div className="space-y-10">
            {/* Action Buttons */}
            {canEdit && (
                <div className="flex justify-end gap-3">
                    {isEditing ? (
                        <>
                            <Button
                                onClick={handleCancel}
                                className="px-4 py-1.5 rounded-md border border-outline-variant/30 text-on-surface text-sm bg-surface-container-low hover:bg-surface-container-high"
                                disabled={save.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="px-4 py-1.5 rounded-md bg-[#A463B0] hover:bg-[#8A5294] text-white text-sm"
                                disabled={save.isPending || isInvalidStdAllowance || isInvalidPf}
                            >
                                {save.isPending ? "Saving…" : "Save Changes"}
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-1.5 rounded-md bg-[#A463B0] hover:bg-[#8A5294] text-white text-sm flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Edit Salary Info
                        </Button>
                    )}
                </div>
            )}

            {/*  Section 1: Overview  */}
            <Section title="Overview">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-5">
                    <Row label="Monthly Wage">
                        <input
                            type="number"
                            className={inputClass()}
                            value={form.monthlyWage}
                            readOnly={!isEditing}
                            onChange={(e) => set("monthlyWage", e.target.value)}
                        />
                    </Row>
                    <Row label="Yearly Wage">
                        <input
                            readOnly
                            type="text"
                            className={readonlyInput}
                            value={formatINR(computed.yearlyWage)}
                        />
                    </Row>
                    <Row label="Working Days / Week">
                        <input
                            type="number"
                            className={inputClass()}
                            value={form.workingDaysPerWeek}
                            readOnly={!isEditing}
                            onChange={(e) => set("workingDaysPerWeek", e.target.value)}
                        />
                    </Row>
                    <Row label="Break Time (hrs)">
                        <input
                            type="number"
                            step="0.5"
                            className={inputClass()}
                            value={formattedMonthlyBreak}
                            readOnly
                        />
                    </Row>
                </div>
            </Section>
            <div className="grid grid-cols-2 space-x-6">
                {/*  Section 2: Salary Components  */}
                <Section title="Salary Components">
                    <div className="gap-x-16 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold">Salary Components</h3>
                            <BreakdownRow label="Basic Salary" value={computed.basic} percent={form.basicSalaryPct} />
                            <BreakdownRow label="HRA" value={computed.hra} percent={form.hraPct} />
                            <BreakdownRow label="Bonus" value={computed.bonus} percent={form.bonusPct} />
                            <BreakdownRow label="LTA" value={computed.lta} percent={form.ltaPct} />
                            <BreakdownRow
                                label="Standard Allowance"
                                value={computed.stdAllowance}
                                percent={computed.stdAllowancePct}
                                editable={isEditing}
                                onEdit={(v) => set("standardAllowance", v)}
                            />
                            {isInvalidStdAllowance && (
                                <p className="text-xs text-red-500 text-right">Standard Allowance cannot exceed ₹ {computed.maxStdAllowance.toLocaleString("en-IN")}</p>
                            )
                            }
                            <BreakdownRow
                                label="Fixed Allowance"
                                value={computed.fixedAllowance}
                                percent={computed.fixedAllowancePct}
                            />
                        </div>
                    </div>
                </Section>

                {/*  Section 3: PF + Tax  */}
                <Section title="Provident Fund & Deductions">
                    <div className="gap-x-16 space-y-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold">Provident Fund & Deductions</h3>

                            {/* PF */}
                            <BreakdownRow
                                label="PF Employee %"
                                value={form.pfEmployeePctOverride ?? config.pfEmployeePct}
                                editable={isEditing}
                                onEdit={(v) => set("pfEmployeePctOverride", v)}
                            />
                            {isInvalidPf && (
                                <p className="text-xs text-red-500 text-right">
                                    PF Employee contribution cannot be less than 12%
                                </p>
                            )}
                            <BreakdownRow label="PF Employer" value={computed.pfEmployer} percent={config.pfEmployerPct} />

                            {/* Deductions */}
                            <BreakdownRow label="Professional Tax" value={computed.professionalTax} showPercent={false} />
                        </div>
                        {/* Net */}
                        <div className="col-span-2 border-t border-outline-variant/20 pt-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-on-surface-variant">Total Deductions</span>
                                <span className="text-sm text-destructive font-medium">- {formatINR(computed.totalDeductions)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-on-surface">Net Monthly Wage</span>
                                <span className="text-sm font-bold text-on-surface">{formatINR(computed.netWage)}</span>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    );
}

//  Sub-components 

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="border border-outline-variant/30 rounded-xl p-6 bg-surface-container-low/30">
            <h3 className="font-h3 text-lg font-bold text-on-surface border-b border-outline-variant/30 pb-2 mb-5">
                {title}
            </h3>
            {children}
        </div>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-4">
            <label className="w-48 shrink-0 text-sm text-on-surface-variant font-medium">{label}</label>
            {children}
        </div>
    );
}