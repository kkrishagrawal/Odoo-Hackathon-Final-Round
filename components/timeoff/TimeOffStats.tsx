"use client";

import { useTimeOff } from "./TimeOffContext";

export function TimeOffStats() {
  const { stats } = useTimeOff();

  // Calculate available days (assuming 24 paid, 7 sick as initial allocations)
  const paidUsed = stats.find(s => s.type === "PAID")?.totalDays || 0;
  const sickUsed = stats.find(s => s.type === "SICK")?.totalDays || 0;
  const unpaidUsed = stats.find(s => s.type === "UNPAID")?.totalDays || 0;

  const paidAvailable = 24 - paidUsed;
  const sickAvailable = 7 - sickUsed;

  return (
    <div className="flex items-center gap-12 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm mb-6">
      <div className="text-center">
        <p className="font-h3 text-[#4DA6FF] text-lg mb-1 font-bold">Paid time Off</p>
        <p className="font-body-md text-on-surface-variant font-medium">{String(paidAvailable).padStart(2, '0')} Days Available</p>
      </div>
      <div className="text-center">
        <p className="font-h3 text-secondary text-lg mb-1 font-bold">Sick time off</p>
        <p className="font-body-md text-on-surface-variant font-medium">{String(sickAvailable).padStart(2, '0')} Days Available</p>
      </div>
      <div className="text-center">
        <p className="font-h3 text-orange-400 text-lg mb-1 font-bold">Unpaid leave</p>
        <p className="font-body-md text-on-surface-variant font-medium">{String(unpaidUsed).padStart(2, '0')} Days Used</p>
      </div>
    </div>
  );
}
