"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface TimeOffRequest {
  id: string;
  name: string;
  start: string;
  end: string;
  type: string;
  status: "pending" | "approved" | "rejected";
}

interface TimeOffContextType {
  requests: TimeOffRequest[];
  addRequest: (request: Omit<TimeOffRequest, "id" | "status" | "name">) => void;
  updateRequestStatus: (id: string, status: "approved" | "rejected") => void;
}

const TimeOffContext = createContext<TimeOffContextType | undefined>(undefined);

export function TimeOffProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<TimeOffRequest[]>([
    { id: "1", name: "[Current Employee]", start: "28/10/2025", end: "28/10/2025", type: "Paid time Off", status: "approved" },
    { id: "2", name: "Alice Johnson", start: "01/11/2025", end: "03/11/2025", type: "Sick leave", status: "pending" },
  ]);

  const addRequest = (request: Omit<TimeOffRequest, "id" | "status" | "name">) => {
    const newRequest: TimeOffRequest = {
      ...request,
      id: Math.random().toString(36).substr(2, 9),
      name: "[Current Employee]",
      status: "pending",
    };
    setRequests((prev) => [newRequest, ...prev]);
  };

  const updateRequestStatus = (id: string, status: "approved" | "rejected") => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
  };

  return (
    <TimeOffContext.Provider value={{ requests, addRequest, updateRequestStatus }}>
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
