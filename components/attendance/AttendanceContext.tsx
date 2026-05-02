"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface BreakEntry {
  pausedAt: string;
  resumedAt: string | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  extraHours: number | null;
  breaks: BreakEntry[];
  user?: { id: string; name: string; role: string };
}

interface AttendanceContextType {
  isCheckedIn: boolean;
  isPaused: boolean;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  todayRecord: AttendanceRecord | null;
  elapsedTime: string;
  myRecords: AttendanceRecord[];
  allRecords: AttendanceRecord[];
  handleCheckIn: () => Promise<void>;
  handleCheckOut: () => Promise<void>;
  handlePause: () => Promise<void>;
  handleUnpause: () => Promise<void>;
  refreshMyRecords: (from?: string, to?: string) => Promise<void>;
  refreshAllRecords: (from?: string, to?: string) => Promise<void>;
  loading: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

/**
 * Compute the current worked hours for the elapsed timer.
 * workHours from DB = accumulated hours (frozen on pause).
 * If not paused, we add the live segment since last resume/checkin.
 */
function computeCurrentWorkedHours(record: AttendanceRecord | null): number {
  if (!record || !record.checkIn) return 0;

  const breaks = record.breaks || [];
  const frozenHours = Number(record.workHours) || 0;

  // If checked out, return frozen total
  if (record.checkOut) return frozenHours;

  // If currently paused (last break has no resumedAt), workHours is already frozen
  if (breaks.length > 0 && breaks[breaks.length - 1].resumedAt === null) {
    return frozenHours;
  }

  // Not paused — add time since last resume (or checkIn if no breaks)
  const lastResumeTime = breaks.length > 0 && breaks[breaks.length - 1].resumedAt
    ? new Date(breaks[breaks.length - 1].resumedAt!).getTime()
    : new Date(record.checkIn).getTime();

  const liveHrs = (Date.now() - lastResumeTime) / (1000 * 60 * 60);
  return frozenHours + liveHrs;
}

function hoursToTimeString(hours: number): string {
  const totalSeconds = Math.floor(hours * 3600);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Derive paused state from the record
  const deriveState = useCallback((record: AttendanceRecord) => {
    if (record.checkIn) {
      setCheckInTime(new Date(record.checkIn));
    }
    if (record.checkOut) {
      setCheckOutTime(new Date(record.checkOut));
      setIsCheckedIn(false);
      setIsPaused(false);
    } else if (record.checkIn) {
      setIsCheckedIn(true);
      setCheckOutTime(null);
      const breaks = record.breaks || [];
      const paused = breaks.length > 0 && breaks[breaks.length - 1].resumedAt === null;
      setIsPaused(paused);
    }
    setTodayRecord(record);
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCheckedIn && !isPaused && checkInTime) {
      interval = setInterval(() => {
        const hrs = computeCurrentWorkedHours(todayRecord);
        setElapsedTime(hoursToTimeString(hrs));
      }, 1000);
    } else if (isCheckedIn && isPaused) {
      // Paused — show frozen time (no ticking)
      const hrs = computeCurrentWorkedHours(todayRecord);
      setElapsedTime(hoursToTimeString(hrs));
    } else if (!isCheckedIn && checkInTime && checkOutTime) {
      const hrs = computeCurrentWorkedHours(todayRecord);
      setElapsedTime(hoursToTimeString(hrs));
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, isPaused, checkInTime, checkOutTime, todayRecord]);

  // On mount + user change: fetch today's attendance status
  useEffect(() => {
    if (!user) return;
    
    fetch("/api/attendance?mode=my")
      .then(res => res.json())
      .then(data => {
        if (data.todayRecord) {
          deriveState(data.todayRecord);
        }
        if (data.records) {
          setMyRecords(data.records);
        }
      })
      .catch(err => console.error("Failed to fetch attendance:", err));
  }, [user, deriveState]);

  const handleCheckIn = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/checkin", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.record) {
        deriveState(data.record);
      } else {
        console.error("Check-in failed:", data.error);
        toast.error(data.error || "Check-in failed");
      }
    } catch (err) {
      console.error("Check-in error:", err);
    }
  }, [deriveState]);

  const handleCheckOut = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.record) {
        deriveState(data.record);
      } else {
        console.error("Check-out failed:", data.error);
        toast.error(data.error || "Check-out failed");
      }
    } catch (err) {
      console.error("Check-out error:", err);
    }
  }, [deriveState]);

  const handlePause = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/pause", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.record) {
        deriveState(data.record);
        toast.success("Work paused");
      } else {
        console.error("Pause failed:", data.error);
        toast.error(data.error || "Pause failed");
      }
    } catch (err) {
      console.error("Pause error:", err);
    }
  }, [deriveState]);

  const handleUnpause = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/unpause", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.record) {
        deriveState(data.record);
        toast.success("Work resumed");
      } else {
        console.error("Unpause failed:", data.error);
        toast.error(data.error || "Unpause failed");
      }
    } catch (err) {
      console.error("Unpause error:", err);
    }
  }, [deriveState]);

  const refreshMyRecords = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    try {
      let url = "/api/attendance?mode=my";
      if (from && to) url += `&from=${from}&to=${to}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.records) setMyRecords(data.records);
      if (data.todayRecord) deriveState(data.todayRecord);
    } catch (err) {
      console.error("Error refreshing my records:", err);
    } finally {
      setLoading(false);
    }
  }, [deriveState]);

  const refreshAllRecords = useCallback(async (from?: string, to?: string) => {
    setLoading(true);
    try {
      let url = "/api/attendance?mode=all";
      if (from && to) {
        url += `&from=${from}&to=${to}`;
      } else {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        url += `&date=${dateStr}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.records) setAllRecords(data.records);
    } catch (err) {
      console.error("Error refreshing all records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AttendanceContext.Provider value={{
      isCheckedIn,
      isPaused,
      checkInTime,
      checkOutTime,
      todayRecord,
      elapsedTime,
      myRecords,
      allRecords,
      handleCheckIn,
      handleCheckOut,
      handlePause,
      handleUnpause,
      refreshMyRecords,
      refreshAllRecords,
      loading,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
}
