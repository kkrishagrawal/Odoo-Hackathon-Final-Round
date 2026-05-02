"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
};

export function TicketsTable() {
  const { data: tickets, isLoading, refetch } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await fetch("/api/tickets");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    },
  });

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update ticket status");
      toast.success("Ticket status updated");
      refetch();
    } catch (err) {
      toast.error("Failed to update status");
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const { user } = useAuth();
  const isAdminOrHR = user?.role === "ADMIN" || user?.role === "HR_OFFICER";

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-4">confirmation_number</span>
        <h3 className="text-xl font-h1 font-semibold text-on-surface">No tickets found</h3>
        <p className="text-on-surface-variant font-body-md mt-2">There are no HR tickets to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/30">
              <th className="px-6 py-4 text-xs font-label-md text-on-surface-variant uppercase tracking-wider w-32">Ticket ID</th>
              <th className="px-6 py-4 text-xs font-label-md text-on-surface-variant uppercase tracking-wider w-32">Date</th>
              {isAdminOrHR && <th className="px-6 py-4 text-xs font-label-md text-on-surface-variant uppercase tracking-wider">Employee</th>}
              <th className="px-6 py-4 text-xs font-label-md text-on-surface-variant uppercase tracking-wider min-w-[200px]">Title</th>
              <th className="px-6 py-4 text-xs font-label-md text-on-surface-variant uppercase tracking-wider w-32 text-center">Status</th>
              {isAdminOrHR && <th className="px-6 py-4 text-xs font-label-md text-on-surface-variant uppercase tracking-wider text-right w-40">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-on-surface-variant">
                  {ticket.id.substring(ticket.id.length - 6).toUpperCase()}
                </td>
                <td className="px-6 py-4 text-sm text-on-surface">
                  {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                </td>
                {isAdminOrHR && (
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-on-surface">{ticket.user.name}</span>
                      <span className="text-xs text-on-surface-variant">{ticket.user.id}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-on-surface line-clamp-1" title={ticket.title}>{ticket.title}</span>
                    <span className="text-xs text-on-surface-variant line-clamp-2 mt-1 opacity-80" title={ticket.description}>
                      {ticket.description}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge
                    variant={
                      ticket.status === "OPEN"
                        ? "destructive"
                        : ticket.status === "IN_PROGRESS"
                        ? "default"
                        : "outline"
                    }
                    className={`uppercase text-[10px] tracking-wider px-3 py-1 rounded-full ${
                      ticket.status === "IN_PROGRESS" ? "bg-primary/20 text-primary border-primary/20" : ""
                    } ${
                      ticket.status === "CLOSED" ? "bg-green-500/10 text-green-600 border-green-500/20" : ""
                    }`}
                  >
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </td>
                {isAdminOrHR && (
                  <td className="px-6 py-4 text-right">
                    <Select
                      value={ticket.status}
                      onValueChange={(value) => handleStatusChange(ticket.id, value)}
                      disabled={updatingId === ticket.id}
                    >
                      <SelectTrigger className="w-[130px] rounded-full text-xs font-semibold h-9 ml-auto">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
