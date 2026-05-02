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

export function computeSalaryBreakdown(info: SalaryInfo): SalaryBreakdown {
    const wage = toNum(info.monthlyWage);

    const basic = (wage * toNum(info.basicSalaryPct)) / 100;
    const hra = (basic * toNum(info.hraPct)) / 100;
    const standardAllowance = toNum(info.standardAllowance);
    const bonus = (basic * toNum(info.bonusPct)) / 100;
    const lta = (basic * toNum(info.ltaPct)) / 100;

    // fixedAllowance = wage - all other components
    const fixedAllowance = wage - basic - hra - standardAllowance - bonus - lta;

    const grossWage = basic + hra + standardAllowance + bonus + lta + fixedAllowance; // = wage

    const pfEmployee = (basic * toNum(info.pfEmployeePct)) / 100;
    const pfEmployer = (basic * toNum(info.pfEmployerPct)) / 100;
    const professionalTax = toNum(info.professionalTax);

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
    const ratio = payableDays / totalWorkingDays;

    return {
        monthlyWage: round(breakdown.monthlyWage * ratio),
        basicSalary: round(breakdown.basicSalary * ratio),
        hra: round(breakdown.hra * ratio),
        standardAllowance: round(breakdown.standardAllowance * ratio),
        bonus: round(breakdown.bonus * ratio),
        lta: round(breakdown.lta * ratio),
        fixedAllowance: round(breakdown.fixedAllowance * ratio),
        grossWage: round(breakdown.grossWage * ratio),
        pfEmployee: round(breakdown.pfEmployee * ratio),
        pfEmployer: round(breakdown.pfEmployer * ratio),
        professionalTax: breakdown.professionalTax, // fixed, not scaled
        totalDeductions: round(breakdown.pfEmployee * ratio + breakdown.professionalTax),
        netWage: round(breakdown.grossWage * ratio - breakdown.pfEmployee * ratio - breakdown.professionalTax),
        employerCost: round(breakdown.monthlyWage * ratio + breakdown.pfEmployer * ratio),
    };
}

function round(n: number): number {
    return Math.round(n * 100) / 100;
}