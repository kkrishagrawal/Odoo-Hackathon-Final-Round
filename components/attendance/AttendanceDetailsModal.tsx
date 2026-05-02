"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { AttendanceRecord } from "./AttendanceContext";

interface BreakEntry {
  pausedAt: string;
  resumedAt: string | null;
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatHours(decimal: number | null): string {
  if (decimal === null || decimal === undefined) return "-";
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h}h ${m}m`;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface AttendanceDetailsModalProps {
  record: AttendanceRecord;
  trigger: React.ReactNode;
}

export function AttendanceDetailsModal({ record, trigger }: AttendanceDetailsModalProps) {
  const [open, setOpen] = useState(false);

  const breaks: BreakEntry[] = (record.breaks as BreakEntry[]) || [];
  const isToday = new Date(record.date).toDateString() === new Date().toDateString();

  // Calculate total break duration
  const totalBreakMs = breaks.reduce((acc, b) => {
    const start = new Date(b.pausedAt).getTime();
    const end = b.resumedAt ? new Date(b.resumedAt).getTime() : Date.now();
    return acc + (end - start);
  }, 0);

  // Determine status
  const getStatus = () => {
    if (record.checkOut) return { label: "Completed", color: "bg-green-500/10 text-green-600 border-green-500/20" };
    if (!record.checkIn) return { label: "No Record", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" };
    if (breaks.length > 0 && breaks[breaks.length - 1].resumedAt === null) {
      return { label: "Paused", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" };
    }
    return { label: "Active", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
  };

  const status = getStatus();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] border-outline-variant/30 shadow-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
            <DialogTitle className="text-xl font-h3 font-bold text-on-surface">
              Attendance Details
            </DialogTitle>
            <Badge variant="outline" className={status.color}>
              {status.label}
            </Badge>
          </div>
          <DialogDescription className="sr-only">
            Detailed attendance record information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 text-sm">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 border border-outline-variant/20">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Date</p>
              <p className="font-semibold text-on-surface text-base">{formatDate(record.date)}{isToday ? " (Today)" : ""}</p>
            </div>
            {record.user?.name && (
              <div className="rounded-xl p-4 border border-outline-variant/20">
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Employee</p>
                <p className="font-semibold text-on-surface text-base">{record.user.name}</p>
              </div>
            )}
          </div>

          {/* Time Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 border border-outline-variant/20">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Check In</p>
              <p className="font-semibold text-on-surface text-lg">{formatTime(record.checkIn)}</p>
            </div>
            <div className="rounded-xl p-4 border border-outline-variant/20">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Check Out</p>
              <p className="font-semibold text-on-surface text-lg">{record.checkOut ? formatTime(record.checkOut) : "—"}</p>
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Work Hours</p>
              <p className="font-bold text-lg">{formatHours(Number(record.workHours))}</p>
            </div>
            <div className="rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Break Time</p>
              <p className="font-bold text-lg">{formatDuration(totalBreakMs)}</p>
            </div>
            <div className="rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mb-1">Extra Hours</p>
              <p className="font-bold text-lg">{formatHours(Number(record.extraHours))}</p>
            </div>
          </div>

          {/* Breaks Timeline */}
          <div>
            <h4 className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider mb-3">
              Breaks ({breaks.length})
            </h4>
            {breaks.length === 0 ? (
              <div className="rounded-xl p-4 border border-outline-variant/20 text-center text-on-surface-variant">
                No breaks taken
              </div>
            ) : (
              <div className="space-y-2">
                {breaks.map((b, i) => {
                  const pausedAt = new Date(b.pausedAt);
                  const resumedAt = b.resumedAt ? new Date(b.resumedAt) : null;
                  const durationMs = resumedAt
                    ? resumedAt.getTime() - pausedAt.getTime()
                    : Date.now() - pausedAt.getTime();

                  return (
                    <div key={i} className="flex items-center gap-3  rounded-lg p-3 border border-outline-variant/20">
                      <div className="w-7 h-7 rounded-full border border-yellow-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-neutral-600">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-on-surface font-medium">
                            {pausedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="text-on-surface-variant">→</span>
                          <span className="text-on-surface font-medium">
                            {resumedAt
                              ? resumedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : "Ongoing..."}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs shrink-0 ${
                        resumedAt ? "border-outline-variant/30 text-on-surface-variant" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 animate-pulse"
                      }`}>
                        {formatDuration(durationMs)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
