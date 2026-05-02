"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  extraHours: number | null;
  user?: { id: string; name: string; role: string };
}

interface AttendanceContextType {
  isCheckedIn: boolean;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  todayRecord: AttendanceRecord | null;
  elapsedTime: string;
  myRecords: AttendanceRecord[];
  allRecords: AttendanceRecord[];
  handleCheckIn: () => Promise<void>;
  handleCheckOut: () => Promise<void>;
  refreshMyRecords: () => Promise<void>;
  refreshAllRecords: () => Promise<void>;
  loading: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCheckedIn && checkInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);
        const hours = Math.floor(diff / 3600).toString().padStart(2, "0");
        const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
        const seconds = (diff % 60).toString().padStart(2, "0");
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    } else if (!isCheckedIn && checkInTime && checkOutTime) {
       const diff = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 1000);
       const hours = Math.floor(diff / 3600).toString().padStart(2, "0");
       const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
       const seconds = (diff % 60).toString().padStart(2, "0");
       setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, checkInTime, checkOutTime]);

  // On mount + user change: fetch today's attendance status
  useEffect(() => {
    if (!user) return;
    
    fetch("/api/attendance?mode=my")
      .then(res => res.json())
      .then(data => {
        if (data.todayRecord) {
          const record = data.todayRecord;
          setTodayRecord(record);
          if (record.checkIn) {
            setCheckInTime(new Date(record.checkIn));
          }
          if (record.checkOut) {
            setCheckOutTime(new Date(record.checkOut));
            setIsCheckedIn(false);
          } else if (record.checkIn) {
            setIsCheckedIn(true);
          }
        }
        if (data.records) {
          setMyRecords(data.records);
        }
      })
      .catch(err => console.error("Failed to fetch attendance:", err));
  }, [user]);

  const handleCheckIn = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/checkin", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.record) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(data.record.checkIn));
        setCheckOutTime(null);
        setTodayRecord(data.record);
      } else {
        console.error("Check-in failed:", data.error);
      }
    } catch (err) {
      console.error("Check-in error:", err);
    }
  }, []);

  const handleCheckOut = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.record) {
        setIsCheckedIn(false);
        setCheckOutTime(new Date(data.record.checkOut));
        setTodayRecord(data.record);
      } else {
        console.error("Check-out failed:", data.error);
      }
    } catch (err) {
      console.error("Check-out error:", err);
    }
  }, []);

  const refreshMyRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance?mode=my");
      const data = await res.json();
      if (data.records) setMyRecords(data.records);
      if (data.todayRecord) setTodayRecord(data.todayRecord);
    } catch (err) {
      console.error("Error refreshing my records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAllRecords = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const res = await fetch(`/api/attendance?mode=all&date=${dateStr}`);
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
      checkInTime,
      checkOutTime,
      todayRecord,
      elapsedTime,
      myRecords,
      allRecords,
      handleCheckIn,
      handleCheckOut,
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
