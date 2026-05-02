export default function EmployeePayrollPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center p-8">
      <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-5xl text-outline">payments</span>
      </div>
      <h1 className="text-4xl font-h1 font-bold text-on-background mb-4">Coming Soon</h1>
      <p className="text-on-surface-variant font-body-lg max-w-md">
        The payroll module is currently under development. Soon you will be able to view and manage your payslips here.
      </p>
    </div>
  );
}
