"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";

export interface TimeOffRequest {
  id: string;
  userId: string;
  type: string; // "PAID" | "SICK" | "UNPAID"
  startDate: string;
  endDate: string | null;
  days: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string | null;
  reviewedBy: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

interface TimeOffContextType {
  requests: TimeOffRequest[];
  stats: { type: string; totalDays: number }[];
  loading: boolean;
  addRequest: (data: { type: string; startDate: string; endDate: string; days: string; note?: string; attachmentUrl?: string }) => Promise<void>;
  updateRequestStatus: (id: string, status: "APPROVED" | "REJECTED") => Promise<void>;
  refreshRequests: (mode: "my" | "all") => Promise<void>;
}

const TimeOffContext = createContext<TimeOffContextType | undefined>(undefined);

/** Map DB enum to display text */
export function mapTypeDisplay(dbType: string): string {
  switch (dbType) {
    case "PAID": return "Paid leave";
    case "SICK": return "Sick leave";
    case "UNPAID": return "Unpaid leave";
    default: return dbType;
  }
}

export function TimeOffProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [stats, setStats] = useState<{ type: string; totalDays: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshRequests = useCallback(async (mode: "my" | "all") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timeoff?mode=${mode}`);
      const data = await res.json();
      if (data.requests) setRequests(data.requests);
      if (data.stats) {
        setStats(data.stats.map((s: { type: string; _sum: { days: number | null } }) => ({
          type: s.type,
          totalDays: s._sum?.days ? Number(s._sum.days) : 0,
        })));
      }
    } catch (err) {
      console.error("Error fetching time-off:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!user) return;
    const mode = user.role === "EMPLOYEE" ? "my" : "all";
    refreshRequests(mode);
  }, [user, refreshRequests]);

  const addRequest = useCallback(async (data: { type: string; startDate: string; endDate: string; days: string; note?: string; attachmentUrl?: string }) => {
    try {
      const res = await fetch("/api/timeoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.request) {
        setRequests(prev => [result.request, ...prev]);
      } else {
        console.error("Failed to create request:", result.error);
      }
    } catch (err) {
      console.error("Error creating time-off request:", err);
    }
  }, []);

  const updateRequestStatus = useCallback(async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/timeoff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (res.ok && result.request) {
        setRequests(prev => prev.map(r => r.id === id ? result.request : r));
      } else {
        console.error("Failed to update status:", result.error);
      }
    } catch (err) {
      console.error("Error updating request status:", err);
    }
  }, []);

  return (
    <TimeOffContext.Provider value={{ requests, stats, loading, addRequest, updateRequestStatus, refreshRequests }}>
      {children}
    </TimeOffContext.Provider>
  );
}

export function useTimeOff() {
  const context = useContext(TimeOffContext);
  if (context === undefined) {
    throw new Error("useTimeOff must be used within a TimeOffProvider");
  }
  return context;
}
