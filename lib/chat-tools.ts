import { prisma } from "@/lib/prisma";
import { Type } from "@google/genai";

interface ToolContext {
  userId: string;
  companyId: string;
  role: string;
}

interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, any>;
  required?: string[];
  handler: (args: any, ctx: ToolContext) => Promise<string>;
}

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function monthRangeUTC(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return { start, end };
}

function fmt(d: Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(d: Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export const tools: ToolDef[] = [
  // ── Employee Self-Service ──
  {
    name: "get_my_attendance",
    description: "Get the current user's attendance records for a given month and year.",
    parameters: { year: { type: Type.NUMBER, description: "Year" }, month: { type: Type.NUMBER, description: "Month (1-12)" } },
    required: ["year", "month"],
    handler: async (args, ctx) => {
      const { start, end } = monthRangeUTC(args.year, args.month);
      const records = await prisma.attendance.findMany({
        where: { userId: ctx.userId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
      });
      if (!records.length) return "No attendance records found for this period.";
      const lines = records.map(r =>
        `${fmt(r.date)} | In: ${fmtTime(r.checkIn)} | Out: ${fmtTime(r.checkOut)} | Work: ${Number(r.workHours ?? 0).toFixed(1)}h | Extra: ${Number(r.extraHours ?? 0).toFixed(1)}h`
      );
      return `Attendance for ${args.month}/${args.year} (${records.length} days):\n${lines.join("\n")}`;
    },
  },
  {
    name: "get_my_leaves",
    description: "Get the current user's time-off requests and remaining leave balance.",
    parameters: {},
    handler: async (_args, ctx) => {
      const requests = await prisma.timeOffRequest.findMany({
        where: { userId: ctx.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      const approved = requests.filter(r => r.status === "APPROVED");
      const pending = requests.filter(r => r.status === "PENDING");
      const totalUsed = approved.reduce((s, r) => s + Number(r.days), 0);
      const lines = requests.slice(0, 10).map(r =>
        `${r.type} | ${fmt(r.startDate)} - ${fmt(r.endDate)} | ${Number(r.days)} day(s) | ${r.status}`
      );
      return `Leave summary:\n- Total approved: ${totalUsed} days\n- Pending: ${pending.length} request(s)\n\nRecent requests:\n${lines.join("\n") || "None"}`;
    },
  },
  {
    name: "apply_for_leave",
    description: "Apply for time off. Creates a new leave request for the current user.",
    parameters: {
      type: { type: Type.STRING, description: "Leave type: PAID, SICK, or UNPAID" },
      startDate: { type: Type.STRING, description: "Start date YYYY-MM-DD" },
      endDate: { type: Type.STRING, description: "End date YYYY-MM-DD" },
      days: { type: Type.NUMBER, description: "Number of days" },
      note: { type: Type.STRING, description: "Optional note" },
    },
    required: ["type", "startDate", "endDate", "days"],
    handler: async (args, ctx) => {
      const req = await prisma.timeOffRequest.create({
        data: {
          userId: ctx.userId,
          type: args.type,
          startDate: new Date(args.startDate),
          endDate: new Date(args.endDate),
          days: args.days,
          note: args.note || null,
        },
      });
      return `Leave request created successfully (ID: ${req.id}). Status: PENDING. Type: ${args.type}, ${args.days} day(s) from ${args.startDate} to ${args.endDate}.`;
    },
  },
  {
    name: "get_my_latest_payslip",
    description: "Get the current user's most recent payslip with full salary breakdown.",
    parameters: {},
    handler: async (_args, ctx) => {
      const payslip = await prisma.payslip.findFirst({
        where: { userId: ctx.userId },
        orderBy: { createdAt: "desc" },
        include: { payrun: true },
      });
      if (!payslip) return "No payslips found.";
      return `Payslip for ${payslip.payrun.month}/${payslip.payrun.year}:
- Monthly Wage: ${Number(payslip.monthlyWage).toLocaleString("en-IN")}
- Basic: ${Number(payslip.basicSalary).toLocaleString("en-IN")}
- HRA: ${Number(payslip.hra).toLocaleString("en-IN")}
- Bonus: ${Number(payslip.bonus).toLocaleString("en-IN")}
- LTA: ${Number(payslip.lta).toLocaleString("en-IN")}
- Gross: ${Number(payslip.grossWage).toLocaleString("en-IN")}
- PF Employee: ${Number(payslip.pfEmployee).toLocaleString("en-IN")}
- Professional Tax: ${Number(payslip.professionalTax).toLocaleString("en-IN")}
- Total Deductions: ${Number(payslip.totalDeductions).toLocaleString("en-IN")}
- Net Wage: ${Number(payslip.netWage).toLocaleString("en-IN")}
- Status: ${payslip.status}`;
    },
  },
  {
    name: "get_my_profile",
    description: "Get the current user's profile information.",
    parameters: {},
    handler: async (_args, ctx) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        include: { company: true, bankDetails: true, salaryInfo: true },
      });
      if (!user) return "User not found.";
      return `Profile:
- Name: ${user.name}
- ID: ${user.id}
- Email: ${user.email}
- Role: ${user.role}
- Department: ${user.department || "N/A"}
- Position: ${user.jobPosition || "N/A"}
- Manager: ${user.managerId || "N/A"}
- Company: ${user.company.name}
- Joined: ${fmt(user.dateOfJoining)}
- Status: ${user.status}
- Monthly Wage: ${user.salaryInfo ? Number(user.salaryInfo.monthlyWage).toLocaleString("en-IN") : "Not configured"}`;
    },
  },
  {
    name: "get_working_hours_today",
    description: "Get the current user's working hours for today.",
    parameters: {},
    handler: async (_args, ctx) => {
      const today = todayUTC();
      const record = await prisma.attendance.findUnique({
        where: { userId_date: { userId: ctx.userId, date: today } },
      });
      if (!record) return "No attendance record for today. You have not checked in.";
      const breaks = (record.breaks as any[]) || [];
      return `Today's attendance:
- Check In: ${fmtTime(record.checkIn)}
- Check Out: ${record.checkOut ? fmtTime(record.checkOut) : "Still working"}
- Work Hours: ${Number(record.workHours ?? 0).toFixed(2)}
- Extra Hours: ${Number(record.extraHours ?? 0).toFixed(2)}
- Breaks: ${breaks.length}`;
    },
  },
  {
    name: "get_my_manager",
    description: "Get information about the current user's manager.",
    parameters: {},
    handler: async (_args, ctx) => {
      const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { managerId: true } });
      if (!user?.managerId) return "No manager assigned.";
      const mgr = await prisma.user.findUnique({ where: { id: user.managerId }, select: { id: true, name: true, email: true, department: true, jobPosition: true } });
      if (!mgr) return "Manager not found.";
      return `Your manager: ${mgr.name} (${mgr.id}), ${mgr.jobPosition || "N/A"}, ${mgr.department || "N/A"}, ${mgr.email}`;
    },
  },

  // ── HR / Admin ──
  {
    name: "get_employees_on_leave_today",
    description: "List employees who are on approved leave today. Requires HR/Admin role.",
    parameters: {},
    handler: async (_args, ctx) => {
      const today = todayUTC();
      const leaves = await prisma.timeOffRequest.findMany({
        where: { user: { companyId: ctx.companyId }, status: "APPROVED", startDate: { lte: today }, endDate: { gte: today } },
        include: { user: { select: { name: true, id: true, department: true } } },
      });
      if (!leaves.length) return "No employees on leave today.";
      return `Employees on leave today (${leaves.length}):\n${leaves.map(l => `- ${l.user.name} (${l.user.id}) | ${l.type} | ${l.user.department || "N/A"}`).join("\n")}`;
    },
  },
  {
    name: "get_absent_employees",
    description: "List employees who have NOT checked in today. Requires HR/Admin role.",
    parameters: {},
    handler: async (_args, ctx) => {
      const today = todayUTC();
      const allEmployees = await prisma.user.findMany({ where: { companyId: ctx.companyId }, select: { id: true, name: true, department: true } });
      const checkedIn = await prisma.attendance.findMany({ where: { user: { companyId: ctx.companyId }, date: today }, select: { userId: true } });
      const checkedInIds = new Set(checkedIn.map(a => a.userId));
      const absent = allEmployees.filter(e => !checkedInIds.has(e.id));
      return `Absent today (${absent.length}/${allEmployees.length}):\n${absent.map(e => `- ${e.name} (${e.id}) | ${e.department || "N/A"}`).join("\n")}`;
    },
  },
  {
    name: "get_pending_leave_requests",
    description: "List all pending time-off requests. Requires HR/Admin role.",
    parameters: {},
    handler: async (_args, ctx) => {
      const pending = await prisma.timeOffRequest.findMany({
        where: { user: { companyId: ctx.companyId }, status: "PENDING" },
        include: { user: { select: { name: true, id: true, department: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      if (!pending.length) return "No pending leave requests.";
      return `Pending leave requests (${pending.length}):\n${pending.map(r => `- ${r.user.name} | ${r.type} | ${fmt(r.startDate)} to ${fmt(r.endDate)} | ${Number(r.days)} day(s) | Note: ${r.note || "None"}`).join("\n")}`;
    },
  },
  {
    name: "get_attendance_summary",
    description: "Get attendance summary for a department or the whole company for a given month.",
    parameters: {
      year: { type: Type.NUMBER, description: "Year" },
      month: { type: Type.NUMBER, description: "Month 1-12" },
      department: { type: Type.STRING, description: "Department name (optional, omit for all)" },
    },
    required: ["year", "month"],
    handler: async (args, ctx) => {
      const { start, end } = monthRangeUTC(args.year, args.month);
      const where: any = { companyId: ctx.companyId };
      if (args.department) where.department = args.department;
      const employees = await prisma.user.findMany({ where, select: { id: true, name: true, department: true } });
      const records = await prisma.attendance.findMany({
        where: { userId: { in: employees.map(e => e.id) }, date: { gte: start, lte: end } },
      });
      const byUser = new Map<string, number>();
      for (const r of records) { byUser.set(r.userId, (byUser.get(r.userId) || 0) + 1); }
      const lines = employees.map(e => `- ${e.name} (${e.department || "N/A"}): ${byUser.get(e.id) || 0} days present`);
      const totalHours = records.reduce((s, r) => s + Number(r.workHours ?? 0), 0);
      return `Attendance summary ${args.month}/${args.year}${args.department ? ` (${args.department})` : ""}:\n- Employees: ${employees.length}\n- Total attendance records: ${records.length}\n- Total work hours: ${totalHours.toFixed(1)}\n\n${lines.join("\n")}`;
    },
  },
  {
    name: "get_new_joiners",
    description: "List employees who joined in a given year.",
    parameters: { year: { type: Type.NUMBER, description: "Year" } },
    required: ["year"],
    handler: async (args, ctx) => {
      const employees = await prisma.user.findMany({
        where: { companyId: ctx.companyId, joiningYear: args.year },
        select: { id: true, name: true, department: true, dateOfJoining: true, role: true },
        orderBy: { dateOfJoining: "asc" },
      });
      if (!employees.length) return `No employees joined in ${args.year}.`;
      return `Employees who joined in ${args.year} (${employees.length}):\n${employees.map(e => `- ${e.name} (${e.id}) | ${e.role} | ${e.department || "N/A"} | Joined: ${fmt(e.dateOfJoining)}`).join("\n")}`;
    },
  },

  // ── Analytics ──
  {
    name: "get_employees_in_office",
    description: "How many employees are currently checked in (in office right now).",
    parameters: {},
    handler: async (_args, ctx) => {
      const count = await prisma.user.count({ where: { companyId: ctx.companyId, status: "IN_OFFICE" } });
      const total = await prisma.user.count({ where: { companyId: ctx.companyId } });
      return `Currently in office: ${count} out of ${total} employees.`;
    },
  },
  {
    name: "get_top_overtime_employees",
    description: "Top employees by extra/overtime hours for a given month.",
    parameters: { year: { type: Type.NUMBER, description: "Year" }, month: { type: Type.NUMBER, description: "Month 1-12" }, limit: { type: Type.NUMBER, description: "Number of top employees (default 5)" } },
    required: ["year", "month"],
    handler: async (args, ctx) => {
      const { start, end } = monthRangeUTC(args.year, args.month);
      const records = await prisma.attendance.findMany({
        where: { user: { companyId: ctx.companyId }, date: { gte: start, lte: end } },
        include: { user: { select: { name: true, id: true } } },
      });
      const byUser = new Map<string, { name: string; hours: number }>();
      for (const r of records) {
        const key = r.userId;
        const cur = byUser.get(key) || { name: r.user.name, hours: 0 };
        cur.hours += Number(r.extraHours ?? 0);
        byUser.set(key, cur);
      }
      const sorted = [...byUser.entries()].sort((a, b) => b[1].hours - a[1].hours).slice(0, args.limit || 5);
      return `Top ${sorted.length} employees by overtime (${args.month}/${args.year}):\n${sorted.map(([id, d], i) => `${i + 1}. ${d.name} (${id}): ${d.hours.toFixed(1)} extra hours`).join("\n")}`;
    },
  },
  {
    name: "get_total_payroll_cost",
    description: "Get total payroll cost for a given month/year from payslips.",
    parameters: { year: { type: Type.NUMBER, description: "Year" }, month: { type: Type.NUMBER, description: "Month 1-12" } },
    required: ["year", "month"],
    handler: async (args, ctx) => {
      const payrun = await prisma.payrun.findUnique({
        where: { companyId_month_year: { companyId: ctx.companyId, month: args.month, year: args.year } },
        include: { payslips: true },
      });
      if (!payrun) return `No payrun found for ${args.month}/${args.year}.`;
      const totalNet = payrun.payslips.reduce((s, p) => s + Number(p.netWage), 0);
      const totalGross = payrun.payslips.reduce((s, p) => s + Number(p.grossWage), 0);
      const totalCost = payrun.payslips.reduce((s, p) => s + Number(p.employerCost), 0);
      return `Payroll for ${args.month}/${args.year}:\n- Status: ${payrun.status}\n- Payslips: ${payrun.payslips.length}\n- Total Gross: ${totalGross.toLocaleString("en-IN")}\n- Total Net: ${totalNet.toLocaleString("en-IN")}\n- Total Employer Cost: ${totalCost.toLocaleString("en-IN")}`;
    },
  },
  {
    name: "get_department_stats",
    description: "Get department-wise employee count and attendance stats.",
    parameters: {},
    handler: async (_args, ctx) => {
      const employees = await prisma.user.findMany({ where: { companyId: ctx.companyId }, select: { department: true, status: true } });
      const depts = new Map<string, { total: number; inOffice: number }>();
      for (const e of employees) {
        const dept = e.department || "Unassigned";
        const cur = depts.get(dept) || { total: 0, inOffice: 0 };
        cur.total++;
        if (e.status === "IN_OFFICE") cur.inOffice++;
        depts.set(dept, cur);
      }
      const lines = [...depts.entries()].map(([d, s]) => `- ${d}: ${s.total} employees, ${s.inOffice} in office`);
      return `Department stats:\n${lines.join("\n")}`;
    },
  },

  // ── Admin ──
  {
    name: "list_users_by_role",
    description: "List all users with a specific role (ADMIN, HR_OFFICER, PAYROLL_OFFICER, EMPLOYEE).",
    parameters: { role: { type: Type.STRING, description: "Role: ADMIN, HR_OFFICER, PAYROLL_OFFICER, or EMPLOYEE" } },
    required: ["role"],
    handler: async (args, ctx) => {
      const users = await prisma.user.findMany({
        where: { companyId: ctx.companyId, role: args.role },
        select: { id: true, name: true, department: true, email: true },
      });
      if (!users.length) return `No users found with role ${args.role}.`;
      return `Users with role ${args.role} (${users.length}):\n${users.map(u => `- ${u.name} (${u.id}) | ${u.department || "N/A"} | ${u.email}`).join("\n")}`;
    },
  },
  {
    name: "get_company_stats",
    description: "Get overall company statistics: employee count, roles, attendance today.",
    parameters: {},
    handler: async (_args, ctx) => {
      const total = await prisma.user.count({ where: { companyId: ctx.companyId } });
      const byRole = await prisma.user.groupBy({ by: ["role"], where: { companyId: ctx.companyId }, _count: true });
      const inOffice = await prisma.user.count({ where: { companyId: ctx.companyId, status: "IN_OFFICE" } });
      const company = await prisma.company.findUnique({ where: { id: ctx.companyId } });
      return `Company: ${company?.name || "Unknown"}\n- Total employees: ${total}\n- In office now: ${inOffice}\n- By role: ${byRole.map(r => `${r.role}: ${r._count}`).join(", ")}`;
    },
  },
  {
    name: "get_employees_without_salary",
    description: "List employees who don't have salary info configured.",
    parameters: {},
    handler: async (_args, ctx) => {
      const users = await prisma.user.findMany({
        where: { companyId: ctx.companyId, salaryInfo: null },
        select: { id: true, name: true, department: true },
      });
      if (!users.length) return "All employees have salary info configured.";
      return `Employees without salary info (${users.length}):\n${users.map(u => `- ${u.name} (${u.id}) | ${u.department || "N/A"}`).join("\n")}`;
    },
  },
  {
    name: "search_employee",
    description: "Search for an employee by name or ID.",
    parameters: { query: { type: Type.STRING, description: "Name or employee ID to search" } },
    required: ["query"],
    handler: async (args, ctx) => {
      const users = await prisma.user.findMany({
        where: { companyId: ctx.companyId, OR: [{ name: { contains: args.query, mode: "insensitive" } }, { id: { contains: args.query, mode: "insensitive" } }] },
        select: { id: true, name: true, role: true, department: true, status: true, email: true },
        take: 10,
      });
      if (!users.length) return `No employees found matching "${args.query}".`;
      return `Search results for "${args.query}" (${users.length}):\n${users.map(u => `- ${u.name} (${u.id}) | ${u.role} | ${u.department || "N/A"} | ${u.status}`).join("\n")}`;
    },
  },
  {
    name: "get_employee_attendance",
    description: "Get a specific employee's attendance for a given month. Requires HR/Admin role.",
    parameters: {
      employeeId: { type: Type.STRING, description: "Employee ID" },
      year: { type: Type.NUMBER, description: "Year" },
      month: { type: Type.NUMBER, description: "Month 1-12" },
    },
    required: ["employeeId", "year", "month"],
    handler: async (args, ctx) => {
      const { start, end } = monthRangeUTC(args.year, args.month);
      const records = await prisma.attendance.findMany({
        where: { userId: args.employeeId, date: { gte: start, lte: end } },
        orderBy: { date: "asc" },
        include: { user: { select: { name: true } } },
      });
      if (!records.length) return `No attendance records for employee ${args.employeeId} in ${args.month}/${args.year}.`;
      const name = records[0].user.name;
      const totalHours = records.reduce((s, r) => s + Number(r.workHours ?? 0), 0);
      const lines = records.map(r => `${fmt(r.date)} | In: ${fmtTime(r.checkIn)} | Out: ${fmtTime(r.checkOut)} | ${Number(r.workHours ?? 0).toFixed(1)}h`);
      return `Attendance for ${name} (${args.employeeId}), ${args.month}/${args.year}:\n- Days present: ${records.length}\n- Total hours: ${totalHours.toFixed(1)}\n\n${lines.join("\n")}`;
    },
  },
];

// Convert tools to Gemini function declarations
export function getGeminiFunctionDeclarations() {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: Type.OBJECT,
      properties: t.parameters,
      required: t.required || [],
    },
  }));
}

// Execute a tool by name
export async function executeTool(name: string, args: any, ctx: ToolContext): Promise<string> {
  const tool = tools.find(t => t.name === name);
  if (!tool) return `Unknown tool: ${name}`;
  try {
    return await tool.handler(args, ctx);
  } catch (err: any) {
    console.error(`Tool ${name} error:`, err);
    return `Error executing ${name}: ${err.message}`;
  }
}
