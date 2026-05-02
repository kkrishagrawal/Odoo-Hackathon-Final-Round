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
import { useState, useEffect } from "react";
import { useTimeOff } from "./TimeOffContext";
import { useAuth } from "@/components/auth/AuthContext";

export function TimeOffRequestModal() {
  const [open, setOpen] = useState(false);
  const { addRequest } = useTimeOff();
  const { user } = useAuth();
  
  const [type, setType] = useState("Paid leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("1");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        // Calculate difference in days (inclusive)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDays(diffDays.toString());
      } else {
        setDays("0");
      }
    }
  }, [startDate, endDate]);

  const handleSubmit = async () => {
    if (!startDate || !endDate) return;
    setSubmitting(true);
    
    await addRequest({
      type,
      startDate,
      endDate,
      days,
      attachmentUrl: note,
    });

    setOpen(false);
    setSubmitting(false);
    
    // Reset form
    setStartDate("");
    setEndDate("");
    setDays("1");
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#A463B0] hover:bg-[#8A5294] text-white rounded-md px-6 shadow-sm">
          NEW
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-surface-container-lowest border-outline-variant/30 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-h3 font-bold text-on-surface border-b border-outline-variant/20 pb-4">
            Time off Type Request
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fill in the details to request time off.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4 text-sm font-body-md">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium">Employee</span>
            <div className="col-span-3 text-on-surface font-semibold">{user?.name || "—"}</div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium leading-tight">Time off Type</span>
            <div className="col-span-3">
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
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium leading-tight">Validity Period</span>
            <div className="col-span-3 flex items-center gap-2">
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
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium">Allocation</span>
            <div className="col-span-3 flex items-center gap-3">
              <Input 
                type="number" 
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-24 bg-surface-container-low border-outline-variant/30 text-on-surface" 
              />
              <span className="text-on-surface-variant font-medium">Days</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="col-span-1 text-on-surface-variant font-medium">Note</span>
            <div className="col-span-3">
              <Input 
                type="text" 
                placeholder="Enter a note..." 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-surface-container-low border-outline-variant/30 text-on-surface w-full" 
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-start gap-3 mt-2 border-t border-outline-variant/20 pt-4">
          <Button onClick={handleSubmit} disabled={submitting} className="bg-[#A463B0] hover:bg-[#8A5294] text-white rounded-md px-8 shadow-sm">
            {submitting ? "Submitting..." : "Submit"}
          </Button>
          <Button onClick={() => setOpen(false)} variant="ghost" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-md px-6 border border-outline-variant/20">
            Discard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
