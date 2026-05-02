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

export function EmployeeTimeOffTable() {
  const { requests } = useTimeOff();
  
  // Only show the requests belonging to the current employee
  const employeeRequests = requests.filter(req => req.name === "[Current Employee]");

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
          {employeeRequests.map((req) => (
            <TableRow key={req.id}>
              <TableCell className="font-medium text-on-surface">{req.name}</TableCell>
              <TableCell>{req.start}</TableCell>
              <TableCell>{req.end}</TableCell>
              <TableCell className={req.type.includes("Paid") ? "text-[#4DA6FF] font-medium" : "text-secondary font-medium"}>{req.type}</TableCell>
              <TableCell>
                {req.status === "pending" ? (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-0.5">
                    PENDING
                  </Badge>
                ) : req.status === "approved" ? (
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
          ))}
          {employeeRequests.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-on-surface-variant">
                No time off requests found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
