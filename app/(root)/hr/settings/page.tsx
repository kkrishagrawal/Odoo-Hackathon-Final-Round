"use client";

import { useState, useEffect, useTransition } from "react";
import { Loader2, Plus, Send, X } from "lucide-react";
import { createEmployee, resendCredentialsEmail, getCompanyEmployees } from "./actions";
import type { EmployeeRow } from "./actions";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE: "bg-blue-500/10 text-blue-600 border-blue-200",
};

export default function HrSettingsPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<Record<string, "sending" | "sent" | "error">>({});
  const [loadingList, setLoadingList] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoadingList(true);
    const list = await getCompanyEmployees();
    setEmployees(list);
    setLoadingList(false);
  }

  function handleCancel() {
    setName("");
    setEmail("");
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);

    startTransition(async () => {
      const result = await createEmployee(fd);
      if (!result.success) {
        toast.error(result.error ?? "Failed to create employee.");
        return;
      }
      
      if (result.emailSent) {
        toast.success(`Account created for ${name}`, {
          description: `Login ID: ${result.loginId} — Credentials emailed.`,
          duration: 10000,
        });
      } else {
        toast.warning(`Account created for ${name}, but email failed.`, {
          description: `Login ID: ${result.loginId} | Password: ${result.password}`,
          duration: 30000,
          closeButton: true,
        });
      }

      setName("");
      setEmail("");
      loadEmployees();
    });
  }

  async function handleResend(userId: string) {
    setSendingId(userId);
    setSendStatus((s) => ({ ...s, [userId]: "sending" }));
    
    const result = await resendCredentialsEmail(userId) as any;
    setSendingId(null);
    
    if (result.success) {
      setSendStatus((s) => ({ ...s, [userId]: "sent" }));
      if (!result.emailSent && result.password) {
        toast.warning("Email delivery failed (SMTP error).", {
          description: `Share this password manually: ${result.password}`,
          duration: 30000,
          closeButton: true,
        });
      } else {
        toast.success("Credentials emailed successfully.");
      }
    } else {
      setSendStatus((s) => ({ ...s, [userId]: "error" }));
      toast.error("Failed to resend credentials.");
    }
    setTimeout(() => {
      setSendStatus((s) => {
        const next = { ...s };
        delete next[userId];
        return next;
      });
    }, 5000);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-background">Settings</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage employees — create new employee accounts and send credentials.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-container text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={16} />
            Add Employee
          </button>
        )}
      </div>

      {/* Create Employee Form */}
      {showForm && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between">
            <h2 className="font-semibold text-on-surface text-base">Create New Employee</h2>
            <button onClick={handleCancel} className="text-on-surface-variant hover:text-on-surface transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="p-5 space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Akshat Gandhi"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Work Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="akshat@company.com"
                  required
                  className="w-full px-3 py-2.5 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 transition-colors"
                />
              </div>
            </div>

            {/* Role indicator (read-only for HR) */}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs">
              <span className="material-symbols-outlined text-sm text-blue-500">lock</span>
              <span className="text-blue-700 font-medium">
                Role is fixed to <strong>Employee</strong> — HR Officers can only create employee accounts.
              </span>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 bg-surface-container-low rounded-lg px-3 py-2.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-sm mt-0.5">info</span>
              <span>
                A Login ID will be auto-generated using your company prefix. The password will be randomly generated and sent to the employee&apos;s email.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={15} />
                    Create &amp; Send Email
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface border border-outline-variant rounded-lg hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/50 flex items-center justify-between">
          <h2 className="font-semibold text-on-surface text-base">Employees</h2>
          <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full font-medium">
            {employees.length} {employees.length === 1 ? "employee" : "employees"}
          </span>
        </div>

        {loadingList ? (
          <div className="flex items-center justify-center py-16 gap-3 text-on-surface-variant">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading employees...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl text-on-surface-variant">person_add</span>
            </div>
            <p className="text-sm font-medium text-on-surface-variant">No employees yet</p>
            <p className="text-xs text-on-surface-variant/70 mt-1">
              Click &quot;Add Employee&quot; to create your first employee account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Login ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Joined</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {employees.map((emp) => {
                  const status = sendStatus[emp.id];
                  return (
                    <tr key={emp.id} className="hover:bg-surface-container-low/50 transition-colors">
                      {/* Name + avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center text-xs font-bold shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-on-surface">{emp.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 text-on-surface-variant">{emp.email}</td>

                      {/* Login ID */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs bg-surface-container px-2 py-1 rounded-md border border-outline-variant/50 text-on-surface tracking-wider">
                          {emp.id}
                        </span>
                      </td>

                      {/* Role badge */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[emp.role] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          Employee
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-on-surface-variant text-xs">
                        {new Date(emp.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Resend email */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleResend(emp.id)}
                          disabled={sendingId === emp.id}
                          title="Resend credentials email"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${status === "sent"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : status === "error"
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:text-primary-container hover:border-primary-container"
                            } disabled:opacity-60`}
                        >
                          {sendingId === emp.id ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Sending...
                            </>
                          ) : status === "sent" ? (
                            <>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Sent!
                            </>
                          ) : status === "error" ? (
                            "Failed"
                          ) : (
                            <>
                              <Send size={12} />
                              Send Mail
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
