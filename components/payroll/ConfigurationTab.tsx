"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/generated/prisma/client";
import { toast } from "sonner";

type PayrollConfig = {
  pfEmployeePct: number;
  pfEmployerPct: number;
  professionalTax: number;
};

interface Props {
  userRole: UserRole;
}

export default function ConfigurationTab(
  // {userRole}: Props
) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [edits, setEdits] = useState<Partial<PayrollConfig>>({});

  const canAccess = true;
  // userRole === UserRole.ADMIN ||
  // userRole === UserRole.PAYROLL_OFFICER;

  // 📡 Fetch config
  const { data, isLoading } = useQuery<PayrollConfig>({
    queryKey: ["payroll-config"],
    queryFn: async () => {
      const res = await fetch("/api/payroll/config");
      const json = await res.json();
      return json.config as PayrollConfig;
    },
  });
  const form = data ? { ...data, ...edits } : null;


  // 💾 Mutation
  const mutation = useMutation({
    mutationFn: async (payload: PayrollConfig) => {
      const res = await fetch("/api/payroll/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["payroll-config"], data.config);
      setEdits({});
      setIsEditing(false);
      toast.success("Payroll config saved");
    },
    onError: () => {
      toast.error("Failed to save payroll config");
    },
  });

  const set = (field: keyof PayrollConfig, value: string) => {
    setEdits((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };


  const handleSave = () => {
    if (!form) return;

    if (
      form.pfEmployeePct < 12 ||
      form.pfEmployeePct > 20 ||
      form.pfEmployerPct < 12 ||
      form.pfEmployerPct > 20
    ) {
      toast.error("PF values must be between 12% and 20%");
      return;
    }

    mutation.mutate(form);
  };

  const handleCancel = () => {
    setEdits({});
    setIsEditing(false);
  };

  if (!canAccess) {
    return (
      <div className="p-4 text-sm text-red-500">
        You are not authorized to view this section.
      </div>
    );
  }

  if (isLoading || !form) {
    return <div className="animate-pulse p-4">Loading payroll config...</div>;
  }

  return (
    <div className="border rounded-xl p-6 space-y-6 bg-surface-container-low/30">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Payroll Configuration</h2>

        {isEditing ? (
          <div className="flex gap-2">
            <Button onClick={handleCancel} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field
          label="PF Employee %"
          value={form.pfEmployeePct}
          editable={isEditing}
          onChange={(v) => set("pfEmployeePct", v)}
          min={12}
          max={20}
        />

        <Field
          label="PF Employer %"
          value={form.pfEmployerPct}
          editable={isEditing}
          onChange={(v) => set("pfEmployerPct", v)}
          min={12}
          max={20}
        />

        <Field
          label="Professional Tax (₹)"
          value={form.professionalTax}
          editable={isEditing}
          onChange={(v) => set("professionalTax", v)}
        />
      </div>
    </div>
  );
}

// 🔹 Field component
function Field({
  label,
  value,
  editable,
  onChange,
  min,
  max
}: {
  label: string;
  value: number;
  editable: boolean;
  onChange?: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-48 text-sm text-muted-foreground">
        {label}
      </label>

      <input
        type="number"
        value={value}
        readOnly={!editable}
        min={min}
        max={max}
        onChange={(e) => onChange?.(e.target.value)}
        className={`border rounded px-3 py-1 text-sm w-full text-right ${editable ? "bg-background" : "bg-muted"
          }`}
      />
    </div>
  );
}