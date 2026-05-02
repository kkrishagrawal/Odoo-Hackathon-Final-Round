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

export function EmployeeAttendanceTab() {
  const { todayRecord } = useAttendance();

  const mockPastRecords = [
    { id: "1", date: "28/10/2025", checkIn: "10:00", checkOut: "19:00", workHours: "09:00", extraHours: "01:00" },
    { id: "2", date: "29/10/2025", checkIn: "10:00", checkOut: "19:00", workHours: "09:00", extraHours: "01:00" },
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
          <option>Oct</option>
          <option>Nov</option>
        </select>
        
        <div className="flex gap-4 ml-auto">
          <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 rounded-md text-sm">
            <span className="text-outline text-xs block leading-none mb-1">Count of days present</span>
            <span className="font-semibold text-primary-container">{todayRecord ? 23 : 22}</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 rounded-md text-sm">
            <span className="text-outline text-xs block leading-none mb-1">Leaves count</span>
            <span className="font-semibold">2</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 rounded-md text-sm">
            <span className="text-outline text-xs block leading-none mb-1">Total working days</span>
            <span className="font-semibold">25</span>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Work Hours</TableHead>
            <TableHead>Extra hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {todayRecord && (
            <TableRow className="bg-primary-container/5 border-l-4 border-l-primary-container">
              <TableCell className="font-medium text-primary-container">{todayRecord.date} (Today)</TableCell>
              <TableCell>{todayRecord.checkIn?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || "-"}</TableCell>
              <TableCell>{todayRecord.checkOut?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || "Active..."}</TableCell>
              <TableCell className="font-bold">{todayRecord.workHours}</TableCell>
              <TableCell>{todayRecord.extraHours}</TableCell>
            </TableRow>
          )}
          {mockPastRecords.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.date}</TableCell>
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
