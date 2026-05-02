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
import { TimeOffDetailsModal } from "./TimeOffDetailsModal";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB');
}

export function EmployeeTimeOffTable() {
  const { requests, refreshRequests } = useTimeOff();
  const { user } = useAuth();
  
  useEffect(() => {
    refreshRequests("my");
  }, [refreshRequests]);

  // Filter only the current user's requests
  const employeeRequests = requests.filter(req => req.userId === user?.id);

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
          {employeeRequests.map((req) => (
            <TimeOffDetailsModal key={req.id} request={req} trigger={
              <TableRow className="cursor-pointer hover:bg-surface-container-low/50">
                <TableCell className="font-medium text-on-surface">{req.user?.name || user?.name || "—"}</TableCell>
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
                  ) : req.status === "APPROVED" ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-0.5">
                      APPROVED
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 px-3 py-0.5">
                      REJECTED
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            } />
          ))}
          {employeeRequests.length === 0 && (
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
