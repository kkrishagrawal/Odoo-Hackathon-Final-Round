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
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect } from "react";

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatHours(decimal: number | null): string {
  if (decimal === null || decimal === undefined) return "-";
  const num = Number(decimal);
  const h = Math.floor(num);
  const m = Math.round((num - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function AllEmployeesAttendanceTab() {
  const { allRecords, todayRecord, elapsedTime, isCheckedIn, refreshAllRecords } = useAttendance();
  const { user } = useAuth();

  useEffect(() => {
    refreshAllRecords();
  }, [refreshAllRecords]);

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
        <div className="font-semibold text-primary-container text-sm uppercase tracking-wider">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <div className="ml-auto bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 rounded-md text-sm">
          <span className="text-outline text-xs block leading-none mb-1">Total checked in today</span>
          <span className="font-semibold text-primary-container">{allRecords.length + (todayRecord && !allRecords.find(r => r.id === todayRecord.id) ? 1 : 0)}</span>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Work Hours</TableHead>
            <TableHead>Extra Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Current user's today record (highlighted) */}
          {todayRecord && todayRecord.checkIn && !allRecords.find(r => r.id === todayRecord.id) && (
            <TableRow className="bg-primary-container/5 border-l-4 border-l-primary-container">
              <TableCell className="font-medium text-primary-container">{user?.name || "You"} (You)</TableCell>
              <TableCell>{formatTime(todayRecord.checkIn)}</TableCell>
              <TableCell>{todayRecord.checkOut ? formatTime(todayRecord.checkOut) : (isCheckedIn ? "Active..." : "-")}</TableCell>
              <TableCell className="font-bold">
                {todayRecord.checkOut ? formatHours(Number(todayRecord.workHours)) : elapsedTime.substring(0, 5)}
              </TableCell>
              <TableCell>{todayRecord.checkOut ? formatHours(Number(todayRecord.extraHours)) : "-"}</TableCell>
            </TableRow>
          )}
          {/* All employee records */}
          {allRecords.map((record) => {
            const isMe = record.userId === user?.id;
            return (
              <TableRow key={record.id} className={isMe ? "bg-primary-container/5 border-l-4 border-l-primary-container" : ""}>
                <TableCell className={`font-medium ${isMe ? "text-primary-container" : ""}`}>
                  {record.user?.name || record.userId} {isMe ? "(You)" : ""}
                </TableCell>
                <TableCell>{formatTime(record.checkIn)}</TableCell>
                <TableCell>
                  {record.checkOut 
                    ? formatTime(record.checkOut)
                    : (isMe && isCheckedIn ? "Active..." : (!record.checkOut ? "Active..." : "-"))
                  }
                </TableCell>
                <TableCell className={isMe ? "font-bold" : ""}>
                  {record.checkOut 
                    ? formatHours(Number(record.workHours)) 
                    : (isMe ? elapsedTime.substring(0, 5) : "Active...")
                  }
                </TableCell>
                <TableCell>{record.checkOut ? formatHours(Number(record.extraHours)) : "-"}</TableCell>
              </TableRow>
            );
          })}
          {allRecords.length === 0 && !todayRecord && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-on-surface-variant">
                No attendance records for today.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
