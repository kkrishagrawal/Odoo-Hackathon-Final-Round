import { TimeOffStats } from "@/components/timeoff/TimeOffStats";
import { EmployeeTimeOffTable } from "@/components/timeoff/EmployeeTimeOffTable";
import { TimeOffRequestModal } from "@/components/timeoff/TimeOffRequestModal";

export default function EmployeeTimeOffPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-h1 font-bold text-on-background">Time Off</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Manage your time off requests.</p>
        </div>
      </div>

      <TimeOffStats />
      
      <div className="flex items-center justify-start border-b border-outline-variant/20 pb-4">
        <TimeOffRequestModal />
      </div>

      <EmployeeTimeOffTable />
    </div>
  );
}
