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
import { useEffect } from "react";

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

export function EmployeeAttendanceTab() {
  const { todayRecord, myRecords, elapsedTime, isCheckedIn, refreshMyRecords } = useAttendance();

  useEffect(() => {
    refreshMyRecords();
  }, [refreshMyRecords]);

  const presentCount = myRecords.filter(r => r.checkIn).length;
  const totalDays = myRecords.length || presentCount;

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
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
            <TableHead>Work Hours</TableHead>
            <TableHead>Extra Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Today's live record */}
          {todayRecord && todayRecord.checkIn && (
            <TableRow className="bg-primary-container/5 border-l-4 border-l-primary-container">
              <TableCell className="font-medium text-primary-container">
                {formatDate(todayRecord.date)} (Today)
              </TableCell>
              <TableCell>{formatTime(todayRecord.checkIn)}</TableCell>
              <TableCell>{todayRecord.checkOut ? formatTime(todayRecord.checkOut) : (isCheckedIn ? "Active..." : "-")}</TableCell>
              <TableCell className="font-bold">
                {todayRecord.checkOut ? formatHours(Number(todayRecord.workHours)) : elapsedTime.substring(0, 5)}
              </TableCell>
              <TableCell>{todayRecord.checkOut ? formatHours(Number(todayRecord.extraHours)) : "-"}</TableCell>
            </TableRow>
          )}
          {/* Past records (exclude today) */}
          {myRecords
            .filter(r => {
              if (!todayRecord) return true;
              return r.id !== todayRecord.id;
            })
            .map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
              <TableCell>{formatTime(record.checkIn)}</TableCell>
              <TableCell>{formatTime(record.checkOut)}</TableCell>
              <TableCell>{formatHours(Number(record.workHours))}</TableCell>
              <TableCell>{formatHours(Number(record.extraHours))}</TableCell>
            </TableRow>
          ))}
          {myRecords.length === 0 && !todayRecord && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-on-surface-variant">
                No attendance records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
