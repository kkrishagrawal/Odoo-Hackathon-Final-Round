import { TimeOffStats } from "@/components/timeoff/TimeOffStats";
import { AdminTimeOffTable } from "@/components/timeoff/AdminTimeOffTable";
import { TimeOffRequestModal } from "@/components/timeoff/TimeOffRequestModal";

export default function TimeOffPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-h1 font-bold text-on-background">Time Off</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Manage employee time off requests.</p>
        </div>
      </div>

      <TimeOffStats />
      
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <TimeOffRequestModal />
        
        <div className="flex-1 max-w-sm ml-4 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Searchbar" 
            className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-full focus:outline-none focus:ring-1 focus:ring-primary-container text-sm text-on-surface"
          />
        </div>
      </div>

      <AdminTimeOffTable />
    </div>
  );
}
