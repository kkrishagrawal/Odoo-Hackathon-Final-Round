// Computation helpers

import { SalaryInfo } from "@/lib/generated/prisma/client";
import { Prisma } from "@/lib/generated/prisma/client";

type Decimal = Prisma.Decimal;

function toNum(d: Decimal | number): number {
    return typeof d === "number" ? d : d.toNumber();
}

export interface SalaryBreakdown {
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
    totalDeductions: number;
    netWage: number;
    employerCost: number; // monthlyWage + pfEmployer
}

export function computeSalaryBreakdown(info: SalaryInfo, config: { pfEmployeePct: number; pfEmployerPct: number; professionalTax: number }): SalaryBreakdown {
    const wage = toNum(info.monthlyWage);

    const basic = (wage * toNum(info.basicSalaryPct)) / 100;
    const hra = (basic * toNum(info.hraPct)) / 100;
    const standardAllowance = toNum(info.standardAllowance);
    const bonus = (basic * toNum(info.bonusPct)) / 100;
    const lta = (basic * toNum(info.ltaPct)) / 100;

    // fixedAllowance = wage - all other components
    const fixedAllowance = wage - basic - hra - standardAllowance - bonus - lta;

    const grossWage = basic + hra + standardAllowance + bonus + lta + fixedAllowance; // = wage

    const pfEmployee = (basic * config.pfEmployeePct) / 100;
    const pfEmployer = (basic * config.pfEmployerPct) / 100;
    const professionalTax = config.professionalTax;

    const totalDeductions = pfEmployee + professionalTax;
    const netWage = grossWage - totalDeductions;
    const employerCost = wage + pfEmployer;

    return {
        monthlyWage: round(wage),
        basicSalary: round(basic),
        hra: round(hra),
        standardAllowance: round(standardAllowance),
        bonus: round(bonus),
        lta: round(lta),
        fixedAllowance: round(fixedAllowance),
        grossWage: round(grossWage),
        pfEmployee: round(pfEmployee),
        pfEmployer: round(pfEmployer),
        professionalTax: round(professionalTax),
        totalDeductions: round(totalDeductions),
        netWage: round(netWage),
        employerCost: round(employerCost),
    };
}

/**
 * Scale a full-month salary breakdown to the actual payable days.
 * payableDays = attendanceDays + paidLeaveDays
 * totalWorkingDays = total calendar working days in that month
 */
export function scaleToPayableDays(
    breakdown: SalaryBreakdown,
    payableDays: number,
    totalWorkingDays: number
): SalaryBreakdown {
    if (totalWorkingDays === 0) return breakdown;

    const unpaidDays = totalWorkingDays - payableDays;

    const unpaidDeduction =
        (breakdown.grossWage / totalWorkingDays) * unpaidDays;

    const payableGross = breakdown.grossWage - unpaidDeduction;

    const ratio = payableGross / breakdown.grossWage;
    
    function getUnpaidLeaveAmount(p: any, totalWorkingDays: number) {
        const payableDays = p.attendanceDays + p.paidLeaveDays;

        if (!payableDays || !totalWorkingDays) return 0;

        const fullGross = p.grossWage * (totalWorkingDays / payableDays);

        const perDay = fullGross / totalWorkingDays;

        return Math.round(perDay * p.unpaidLeaveDays);
    }
    const scaled = {
        monthlyWage: breakdown.monthlyWage * ratio,
        basicSalary: breakdown.basicSalary * ratio,
        hra: breakdown.hra * ratio,
        standardAllowance: breakdown.standardAllowance * ratio,
        bonus: breakdown.bonus * ratio,
        lta: breakdown.lta * ratio,
        fixedAllowance: breakdown.fixedAllowance * ratio,
        grossWage: breakdown.grossWage * ratio,
        pfEmployee: breakdown.pfEmployee * ratio,
        pfEmployer: breakdown.pfEmployer * ratio,
    };

    const professionalTax = breakdown.professionalTax;

    const totalDeductions = scaled.pfEmployee + professionalTax;
    const netWage = scaled.grossWage - totalDeductions;
    const employerCost = scaled.monthlyWage + scaled.pfEmployer;

    return {
        monthlyWage: round(scaled.monthlyWage),
        basicSalary: round(scaled.basicSalary),
        hra: round(scaled.hra),
        standardAllowance: round(scaled.standardAllowance),
        bonus: round(scaled.bonus),
        lta: round(scaled.lta),
        fixedAllowance: round(scaled.fixedAllowance),
        grossWage: round(scaled.grossWage),
        pfEmployee: round(scaled.pfEmployee),
        pfEmployer: round(scaled.pfEmployer),
        professionalTax: round(professionalTax),
        totalDeductions: round(totalDeductions),
        netWage: round(netWage),
        employerCost: round(employerCost),
    };
}

function round(n: number): number {
    return Math.round(n * 100) / 100;
}