import { EmployeeAttendanceTab } from "@/components/attendance/EmployeeAttendanceTab";

export default function EmployeeAttendancePage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-h1 font-bold text-on-background">My Attendance</h1>
        <p className="text-on-surface-variant font-body-md mt-1">Track your daily attendances.</p>
      </div>

      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm">
        <EmployeeAttendanceTab />
      </div>
    </div>
  );
}
