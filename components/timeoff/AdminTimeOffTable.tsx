"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTimeOff, mapTypeDisplay } from "./TimeOffContext";
import { useAuth } from "@/components/auth/AuthContext";
import { useEffect, useState } from "react";
import { TimeOffDetailsModal } from "./TimeOffDetailsModal";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB');
}

export function AdminTimeOffTable() {
  const { requests, updateRequestStatus, refreshRequests } = useTimeOff();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    refreshRequests("all");
  }, [refreshRequests]);

  const filteredRequests = requests.filter(req => {
    const nameMatch = (req.user?.name || req.userId).toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = req.type.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = req.status.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || typeMatch || statusMatch;
  });

  // Determine if the current user can approve a given request
  const canApprove = (requesterRole: string): boolean => {
    if (user?.role === "ADMIN") return true; // Admin can approve everyone
    // HR/Payroll can only approve EMPLOYEE leaves, not each other's
    if (requesterRole === "HR_OFFICER" || requesterRole === "PAYROLL_OFFICER" || requesterRole === "ADMIN") return false;
    return true; // HR/Payroll can approve employee leaves
  };

  return (
    <div className="mt-4">
      <div className="flex justify-start mb-4">
        <div className="relative w-full max-w-2xl">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Search by name, type, or status..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-container text-sm text-on-surface"
          />
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        <Table>
        <TableHeader>
          <TableRow className="bg-surface-container-low/50">
            <TableHead className="font-semibold text-on-surface">Name</TableHead>
            <TableHead className="font-semibold text-on-surface">Start Date</TableHead>
            <TableHead className="font-semibold text-on-surface">End Date</TableHead>
            <TableHead className="font-semibold text-on-surface">Time off Type</TableHead>
            <TableHead className="font-semibold text-on-surface">Days</TableHead>
            <TableHead className="font-semibold text-on-surface">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.map((req) => (
            <TimeOffDetailsModal key={req.id} request={req} trigger={
              <TableRow className="cursor-pointer hover:bg-surface-container-low/50">
                <TableCell className="font-medium text-on-surface">{req.user?.name || req.userId}</TableCell>
                <TableCell>{formatDate(req.startDate)}</TableCell>
                <TableCell>{req.endDate ? formatDate(req.endDate) : "-"}</TableCell>
                <TableCell className={req.type === "PAID" ? "text-[#4DA6FF] font-medium" : "text-secondary font-medium"}>
                  {mapTypeDisplay(req.type)}
                </TableCell>
                <TableCell>{Number(req.days)}</TableCell>
                <TableCell>
                  {req.status === "PENDING" ? (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-0.5">
                      PENDING
                    </Badge>
                  ) : (
                    <Badge variant={req.status === "APPROVED" ? "default" : "destructive"} className={req.status === "APPROVED" ? "bg-green-500 hover:bg-green-600" : ""}>
                      {req.status}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            } />
          ))}
          {filteredRequests.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-on-surface-variant">
                No time off requests found matching your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
