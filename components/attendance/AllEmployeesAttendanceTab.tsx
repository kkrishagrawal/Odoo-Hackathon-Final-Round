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
import { useEffect, useState } from "react";
import { AttendanceDetailsModal } from "./AttendanceDetailsModal";

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

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function AllEmployeesAttendanceTab() {
  const { allRecords, todayRecord, elapsedTime, isCheckedIn, refreshAllRecords } = useAttendance();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Default: today only
  const [fromDate, setFromDate] = useState(() => toDateStr(new Date()));
  const [toDate, setToDate] = useState(() => toDateStr(new Date()));

  useEffect(() => {
    refreshAllRecords(fromDate, toDate);
  }, [refreshAllRecords, fromDate, toDate]);

  const filteredRecords = allRecords.filter(record => {
    const nameMatch = (record.user?.name || record.userId).toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch;
  });

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
        <div className="ml-auto flex items-center gap-4">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-container text-sm text-on-surface"
            />
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 px-4 py-1.5 rounded-md text-sm">
            <span className="text-outline text-xs block leading-none mb-1">Total records</span>
            <span className="font-semibold text-primary-container">{allRecords.length + (todayRecord && !allRecords.find(r => r.id === todayRecord.id) ? 1 : 0)}</span>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Breaks</TableHead>
            <TableHead>Work Hours</TableHead>
            <TableHead>Extra Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Current user's today record (highlighted) */}
          {todayRecord && todayRecord.checkIn && !allRecords.find(r => r.id === todayRecord.id) && (
            <AttendanceDetailsModal record={todayRecord} trigger={
              <TableRow className="bg-primary-container/5 border-l-4 border-l-primary-container cursor-pointer hover:bg-primary-container/10 transition-colors">
                <TableCell className="font-medium text-primary-container">{user?.name || "You"} (You)</TableCell>
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
          {/* All employee records */}
          {filteredRecords.map((record) => {
            const isMe = record.userId === user?.id;
            return (
              <AttendanceDetailsModal key={record.id} record={record} trigger={
                <TableRow className={`cursor-pointer transition-colors ${isMe ? "bg-primary-container/5 border-l-4 border-l-primary-container hover:bg-primary-container/10" : "hover:bg-surface-container-low/50"}`}>
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
                  <TableCell>
                    <span className="text-xs bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant/30 font-medium">
                      {(record.breaks as any[] || []).length}
                    </span>
                  </TableCell>
                  <TableCell className={isMe ? "font-bold" : ""}>
                    {record.checkOut 
                      ? formatHours(Number(record.workHours)) 
                      : (isMe ? elapsedTime.substring(0, 5) : "Active...")
                    }
                  </TableCell>
                  <TableCell>{record.checkOut ? formatHours(Number(record.extraHours)) : "-"}</TableCell>
                </TableRow>
              } />
            );
          })}
          {filteredRecords.length === 0 && !todayRecord && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-on-surface-variant">
                No attendance records for today matching your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
