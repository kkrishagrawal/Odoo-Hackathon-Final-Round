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
import { useEffect, useState } from "react";
import { AttendanceDetailsModal } from "./AttendanceDetailsModal";

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB');
}

function formatHours(decimal: number | null): string {
  if (decimal === null || decimal === undefined) return "-";
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function EmployeeAttendanceTab() {
  const { todayRecord, myRecords, elapsedTime, isCheckedIn, refreshMyRecords } = useAttendance();
  
  // Default to last 30 days
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return toDateStr(d);
  });
  const [toDate, setToDate] = useState(() => toDateStr(new Date()));

  useEffect(() => {
    refreshMyRecords(fromDate, toDate);
  }, [refreshMyRecords, fromDate, toDate]);

  const presentCount = myRecords.filter(r => r.checkIn).length;
  const totalDays = myRecords.length || presentCount;

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-on-surface-variant font-medium">From</label>
          <input 
            type="date" 
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 rounded-md text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
          <label className="text-xs text-on-surface-variant font-medium">To</label>
          <input 
            type="date" 
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/30 px-3 py-1.5 rounded-md text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
          />
        </div>
        <div className="flex gap-4 ml-auto">
          <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 rounded-md text-sm">
            <span className="text-outline text-xs block leading-none mb-1">Days present</span>
            <span className="font-semibold text-primary-container">{presentCount}</span>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 rounded-md text-sm">
            <span className="text-outline text-xs block leading-none mb-1">Total records</span>
            <span className="font-semibold">{totalDays}</span>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Breaks</TableHead>
            <TableHead>Work Hours</TableHead>
            <TableHead>Extra Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Today's live record */}
          {todayRecord && todayRecord.checkIn && (
            <AttendanceDetailsModal record={todayRecord} trigger={
              <TableRow className="bg-primary-container/5 border-l-4 border-l-primary-container cursor-pointer hover:bg-primary-container/10 transition-colors">
                <TableCell className="font-medium text-primary-container">
                  {formatDate(todayRecord.date)} (Today)
                </TableCell>
                <TableCell>{formatTime(todayRecord.checkIn)}</TableCell>
                <TableCell>{todayRecord.checkOut ? formatTime(todayRecord.checkOut) : (isCheckedIn ? "Active..." : "-")}</TableCell>
                <TableCell>
                  <span className="text-xs bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant/30 font-medium">
                    {(todayRecord.breaks as any[] || []).length}
                  </span>
                </TableCell>
                <TableCell className="font-bold">
                  {todayRecord.checkOut ? formatHours(Number(todayRecord.workHours)) : elapsedTime.substring(0, 5)}
                </TableCell>
                <TableCell>{todayRecord.checkOut ? formatHours(Number(todayRecord.extraHours)) : "-"}</TableCell>
              </TableRow>
            } />
          )}
          {/* Past records (exclude today) */}
          {myRecords
            .filter(r => {
              if (!todayRecord) return true;
              return r.id !== todayRecord.id;
            })
            .map((record) => (
            <AttendanceDetailsModal key={record.id} record={record} trigger={
              <TableRow className="cursor-pointer hover:bg-surface-container-low/50 transition-colors">
                <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                <TableCell>{formatTime(record.checkIn)}</TableCell>
                <TableCell>{formatTime(record.checkOut)}</TableCell>
                <TableCell>
                  <span className="text-xs bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant/30 font-medium">
                    {(record.breaks as any[] || []).length}
                  </span>
                </TableCell>
                <TableCell>{formatHours(Number(record.workHours))}</TableCell>
                <TableCell>{formatHours(Number(record.extraHours))}</TableCell>
              </TableRow>
            } />
          ))}
          {myRecords.length === 0 && !todayRecord && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-on-surface-variant">
                No attendance records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
