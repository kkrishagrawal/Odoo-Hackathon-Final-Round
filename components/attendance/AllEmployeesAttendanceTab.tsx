"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAttendance } from "./AttendanceContext";

export function AllEmployeesAttendanceTab() {
  const { todayRecord } = useAttendance();

  const mockOtherEmployees = [
    { id: "e1", name: "Alice Johnson", checkIn: "09:00", checkOut: "18:00", workHours: "09:00", extraHours: "01:00" },
    { id: "e2", name: "Bob Smith", checkIn: "09:15", checkOut: "-", workHours: "Active...", extraHours: "-" },
  ];

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
        <div className="flex bg-surface-container-low border border-outline-variant/30 rounded-md overflow-hidden">
          <button className="px-3 py-1.5 hover:bg-surface-container-high transition-colors material-symbols-outlined text-sm">chevron_left</button>
          <div className="w-px bg-outline-variant/30" />
          <button className="px-3 py-1.5 hover:bg-surface-container-high transition-colors material-symbols-outlined text-sm">chevron_right</button>
        </div>
        
        <select className="bg-surface-container-low border border-outline-variant/30 rounded-md px-3 py-1.5 text-sm font-medium">
          <option>Date</option>
          <option>Month</option>
        </select>

        <button className="bg-surface-container-low border border-outline-variant/30 rounded-md px-4 py-1.5 text-sm font-medium hover:bg-surface-container-high transition-colors">
          Day
        </button>
      </div>

      <div className="font-semibold text-primary-container mb-2 text-sm uppercase tracking-wider">
        {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Emp</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Work Hours</TableHead>
            <TableHead>Extra hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {todayRecord && (
            <TableRow className="bg-primary-container/5 border-l-4 border-l-primary-container">
              <TableCell className="font-medium text-primary-container">{todayRecord.empName} (You)</TableCell>
              <TableCell>{todayRecord.checkIn?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || "-"}</TableCell>
              <TableCell>{todayRecord.checkOut?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || "Active..."}</TableCell>
              <TableCell className="font-bold">{todayRecord.workHours}</TableCell>
              <TableCell>{todayRecord.extraHours}</TableCell>
            </TableRow>
          )}
          {mockOtherEmployees.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.name}</TableCell>
              <TableCell>{record.checkIn}</TableCell>
              <TableCell>{record.checkOut}</TableCell>
              <TableCell>{record.workHours}</TableCell>
              <TableCell>{record.extraHours}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
