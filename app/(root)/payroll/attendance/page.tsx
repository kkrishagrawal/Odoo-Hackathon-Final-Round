import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeAttendanceTab } from "@/components/attendance/EmployeeAttendanceTab";
import { AllEmployeesAttendanceTab } from "@/components/attendance/AllEmployeesAttendanceTab";

export default function AttendancePage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-h1 font-bold text-on-background">Attendance</h1>
        <p className="text-on-surface-variant font-body-md mt-1">Manage and track attendances.</p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Employees</TabsTrigger>
          <TabsTrigger value="my">My Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm">
          <AllEmployeesAttendanceTab />
        </TabsContent>
        <TabsContent value="my" className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm">
          <EmployeeAttendanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
