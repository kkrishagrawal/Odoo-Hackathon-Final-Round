"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AttendanceRecord {
  id: string;
  empName: string;
  date: string;
  checkIn: Date | null;
  checkOut: Date | null;
  workHours: string;
  extraHours: string;
}

interface AttendanceContextType {
  isCheckedIn: boolean;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  todayRecord: AttendanceRecord | null;
  elapsedTime: string;
  handleCheckIn: () => void;
  handleCheckOut: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");

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

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setCheckInTime(new Date());
    setCheckOutTime(null);
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckOutTime(new Date());
  };

  const todayRecord: AttendanceRecord | null = checkInTime ? {
    id: "live-record",
    empName: "Current User",
    date: checkInTime.toLocaleDateString('en-GB'),
    checkIn: checkInTime,
    checkOut: checkOutTime,
    workHours: elapsedTime.substring(0, 5), // Only HH:MM for table
    extraHours: "00:00" // Mocked extra hours
  } : null;

  return (
    <AttendanceContext.Provider value={{
      isCheckedIn,
      checkInTime,
      checkOutTime,
      todayRecord,
      elapsedTime,
      handleCheckIn,
      handleCheckOut
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
