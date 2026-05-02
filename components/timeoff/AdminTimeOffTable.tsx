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
import { useTimeOff } from "./TimeOffContext";

export function AdminTimeOffTable() {
  const { requests, updateRequestStatus } = useTimeOff();

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden mt-6">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-container-low/50">
            <TableHead className="font-semibold text-on-surface">Name</TableHead>
            <TableHead className="font-semibold text-on-surface">Start Date</TableHead>
            <TableHead className="font-semibold text-on-surface">End Date</TableHead>
            <TableHead className="font-semibold text-on-surface">Time off Type</TableHead>
            <TableHead className="font-semibold text-on-surface">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="font-medium text-on-surface">{req.name}</TableCell>
              <TableCell>{req.start}</TableCell>
              <TableCell>{req.end}</TableCell>
              <TableCell className={req.type.includes("Paid") ? "text-[#4DA6FF] font-medium" : "text-secondary font-medium"}>{req.type}</TableCell>
              <TableCell>
                {req.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateRequestStatus(req.id, "rejected")}
                      className="w-8 h-6 bg-red-400 rounded-md flex items-center justify-center hover:bg-red-500 transition-colors shadow-sm" title="Reject"
                    >
                      <span className="material-symbols-outlined text-white text-[16px] font-bold">close</span>
                    </button>
                    <button 
                      onClick={() => updateRequestStatus(req.id, "approved")}
                      className="w-8 h-6 bg-green-500 rounded-md flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm" title="Approve"
                    >
                      <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>
                    </button>
                  </div>
                ) : (
                  <Badge variant={req.status === "approved" ? "default" : "destructive"} className={req.status === "approved" ? "bg-green-500 hover:bg-green-600" : ""}>
                    {req.status.toUpperCase()}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
