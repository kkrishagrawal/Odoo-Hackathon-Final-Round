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
import { useEffect } from "react";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB');
}

export function AdminTimeOffTable() {
  const { requests, updateRequestStatus, refreshRequests } = useTimeOff();
  const { user } = useAuth();

  useEffect(() => {
    refreshRequests("all");
  }, [refreshRequests]);

  // Determine if the current user can approve a given request
  const canApprove = (requesterRole: string): boolean => {
    if (user?.role === "ADMIN") return true; // Admin can approve everyone
    // HR/Payroll can only approve EMPLOYEE leaves, not each other's
    if (requesterRole === "HR_OFFICER" || requesterRole === "PAYROLL_OFFICER" || requesterRole === "ADMIN") return false;
    return true; // HR/Payroll can approve employee leaves
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden mt-6">
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
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="font-medium text-on-surface">{req.user?.name || req.userId}</TableCell>
              <TableCell>{formatDate(req.startDate)}</TableCell>
              <TableCell>{req.endDate ? formatDate(req.endDate) : "-"}</TableCell>
              <TableCell className={req.type === "PAID" ? "text-[#4DA6FF] font-medium" : "text-secondary font-medium"}>
                {mapTypeDisplay(req.type)}
              </TableCell>
              <TableCell>{Number(req.days)}</TableCell>
              <TableCell>
                {req.status === "PENDING" ? (
                  canApprove(req.user?.role || "") ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateRequestStatus(req.id, "REJECTED")}
                        className="w-8 h-6 bg-red-400 rounded-md flex items-center justify-center hover:bg-red-500 transition-colors shadow-sm" title="Reject"
                      >
                        <span className="material-symbols-outlined text-white text-[16px] font-bold">close</span>
                      </button>
                      <button 
                        onClick={() => updateRequestStatus(req.id, "APPROVED")}
                        className="w-8 h-6 bg-green-500 rounded-md flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm" title="Approve"
                      >
                        <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
                      </button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-0.5">
                      ADMIN ONLY
                    </Badge>
                  )
                ) : (
                  <Badge variant={req.status === "APPROVED" ? "default" : "destructive"} className={req.status === "APPROVED" ? "bg-green-500 hover:bg-green-600" : ""}>
                    {req.status}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-on-surface-variant">
                No time off requests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
