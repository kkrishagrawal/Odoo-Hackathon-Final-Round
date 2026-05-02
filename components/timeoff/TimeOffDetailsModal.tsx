"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useTimeOff, TimeOffRequest, mapTypeDisplay } from "./TimeOffContext";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface TimeOffDetailsModalProps {
  request: TimeOffRequest;
  trigger: React.ReactNode;
}

export function TimeOffDetailsModal({ request, trigger }: TimeOffDetailsModalProps) {
  const [open, setOpen] = useState(false);
  const { updateRequest, updateRequestStatus } = useTimeOff();
  const { user } = useAuth();
  
  const [type, setType] = useState(mapTypeDisplay(request.type));
  const [startDate, setStartDate] = useState(request.startDate.split('T')[0]);
  const [endDate, setEndDate] = useState(request.endDate ? request.endDate.split('T')[0] : request.startDate.split('T')[0]);
  const [days, setDays] = useState(request.days.toString());
  const [note, setNote] = useState(request.note || "");
  const [submitting, setSubmitting] = useState(false);

  // Check roles
  const isRequester = user?.id === request.userId;
  const isPending = request.status === "PENDING";
  const canEdit = isRequester && isPending;
  
  const canApprove = () => {
    if (user?.role === "ADMIN") return true;
    if (request.user?.role === "HR_OFFICER" || request.user?.role === "PAYROLL_OFFICER" || request.user?.role === "ADMIN") return false;
    return user?.role === "HR_OFFICER" || user?.role === "PAYROLL_OFFICER";
  };

  const showApprovalButtons = !isRequester && isPending && canApprove();

  useEffect(() => {
    if (canEdit && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDays(diffDays.toString());
      } else {
        setDays("0");
      }
    }
  }, [startDate, endDate, canEdit]);

  const handleUpdate = async () => {
    if (!startDate || !endDate) return;
    setSubmitting(true);
    
    await updateRequest(request.id, {
      type,
      startDate,
      endDate,
      days,
      attachmentUrl: note,
    });

    toast.success("Time off request updated");
    setOpen(false);
    setSubmitting(false);
  };

  const handleStatusUpdate = async (newStatus: "APPROVED" | "REJECTED") => {
    setSubmitting(true);
    await updateRequestStatus(request.id, newStatus);
    toast.success(`Request ${newStatus.toLowerCase()}`);
    setOpen(false);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-surface-container-lowest border-outline-variant/30 shadow-xl">
        <DialogHeader>
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4">
            <DialogTitle className="text-xl font-h3 font-bold text-on-surface">
              Time Off Request Details
            </DialogTitle>
            <Badge variant="outline" className={
              request.status === "PENDING" ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" : 
              request.status === "APPROVED" ? "bg-green-500/10 text-green-600 border-green-500/20" : 
              "bg-red-500/10 text-red-600 border-red-500/20"
            }>
              {request.status}
            </Badge>
          </div>
          <DialogDescription className="sr-only">
            View or edit time off request details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4 text-sm font-body-md">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium">Employee</span>
            <div className="col-span-3 text-on-surface font-semibold">{request.user?.name || "—"}</div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium leading-tight">Time off Type</span>
            <div className="col-span-3">
              {canEdit ? (
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full bg-surface-container-low border-outline-variant/30 text-on-surface">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-container-lowest border-outline-variant/30">
                    <SelectItem value="Paid leave">Paid leave</SelectItem>
                    <SelectItem value="Sick leave">Sick leave</SelectItem>
                    <SelectItem value="Unpaid leave">Unpaid leave</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-medium text-on-surface bg-surface-container-low px-3 py-2 rounded-md">{type}</div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium leading-tight">Validity Period</span>
            <div className="col-span-3 flex items-center gap-2">
              {canEdit ? (
                <>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-surface-container-low border-outline-variant/30 text-on-surface flex-1" 
                  />
                  <span className="text-on-surface-variant font-medium">To</span>
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-surface-container-low border-outline-variant/30 text-on-surface flex-1" 
                  />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="font-medium text-on-surface bg-surface-container-low px-3 py-2 rounded-md flex-1">{startDate}</div>
                  <span className="text-on-surface-variant font-medium">To</span>
                  <div className="font-medium text-on-surface bg-surface-container-low px-3 py-2 rounded-md flex-1">{endDate}</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium">Allocation</span>
            <div className="col-span-3 flex items-center gap-3">
              {canEdit ? (
                <Input 
                  type="number" 
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-24 bg-surface-container-low border-outline-variant/30 text-on-surface" 
                />
              ) : (
                <div className="font-medium text-on-surface bg-surface-container-low px-3 py-2 rounded-md w-24 text-center">{days}</div>
              )}
              <span className="text-on-surface-variant font-medium">Days</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium">Note</span>
            <div className="col-span-3">
              {canEdit ? (
                <Input 
                  type="text" 
                  placeholder="Enter a note..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-surface-container-low border-outline-variant/30 text-on-surface w-full" 
                />
              ) : (
                <div className="font-medium text-on-surface bg-surface-container-low px-3 py-2 rounded-md min-h-[40px] whitespace-pre-wrap">
                  {note || "No notes provided."}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-start gap-3 mt-2 border-t border-outline-variant/20 pt-4">
          {canEdit && (
            <Button onClick={handleUpdate} disabled={submitting} className="bg-[#A463B0] hover:bg-[#8A5294] text-white rounded-md px-8 shadow-sm">
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
          
          {showApprovalButtons && (
            <>
              <Button onClick={() => handleStatusUpdate("APPROVED")} disabled={submitting} className="bg-green-500 hover:bg-green-600 text-white rounded-md px-8 shadow-sm">
                Approve
              </Button>
              <Button onClick={() => handleStatusUpdate("REJECTED")} disabled={submitting} className="bg-red-500 hover:bg-red-600 text-white rounded-md px-8 shadow-sm">
                Reject
              </Button>
            </>
          )}
          
          <Button onClick={() => setOpen(false)} variant="ghost" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-md px-6 border border-outline-variant/20">
            {canEdit || showApprovalButtons ? "Cancel" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
