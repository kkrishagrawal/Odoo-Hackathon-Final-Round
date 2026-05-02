import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

const handler = createMcpHandler(
  (server) => {
    // ── Employee Self-Service ──

    server.tool(
      "get_my_attendance",
      "Get an employee's attendance records for a given month and year.",
      { userId: z.string(), year: z.number(), month: z.number().min(1).max(12) },
      async ({ userId, year, month }) => {
        const { start, end } = monthRangeUTC(year, month);
        const records = await prisma.attendance.findMany({
          where: { userId, date: { gte: start, lte: end } },
          orderBy: { date: "asc" },
        });
        if (!records.length) return { content: [{ type: "text" as const, text: "No attendance records found for this period." }] };
        const lines = records.map(r =>
          `${fmt(r.date)} | In: ${fmtTime(r.checkIn)} | Out: ${fmtTime(r.checkOut)} | Work: ${Number(r.workHours ?? 0).toFixed(1)}h | Extra: ${Number(r.extraHours ?? 0).toFixed(1)}h`
        );
        return { content: [{ type: "text" as const, text: `Attendance for ${month}/${year} (${records.length} days):\n${lines.join("\n")}` }] };
      }
    );

    server.tool(
      "get_my_leaves",
      "Get an employee's time-off requests and leave summary.",
      { userId: z.string() },
      async ({ userId }) => {
        const requests = await prisma.timeOffRequest.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        const approved = requests.filter(r => r.status === "APPROVED");
        const pending = requests.filter(r => r.status === "PENDING");
        const totalUsed = approved.reduce((s, r) => s + Number(r.days), 0);
        const lines = requests.slice(0, 10).map(r =>
          `${r.type} | ${fmt(r.startDate)} - ${fmt(r.endDate)} | ${Number(r.days)} day(s) | ${r.status}`
        );
        return { content: [{ type: "text" as const, text: `Leave summary:\n- Total approved: ${totalUsed} days\n- Pending: ${pending.length}\n\nRecent:\n${lines.join("\n") || "None"}` }] };
      }
    );

    server.tool(
      "apply_for_leave",
      "Apply for time off. Creates a new leave request.",
      {
        userId: z.string(),
        type: z.enum(["PAID", "SICK", "UNPAID"]),
        startDate: z.string().describe("YYYY-MM-DD"),
        endDate: z.string().describe("YYYY-MM-DD"),
        days: z.number(),
        note: z.string().optional(),
      },
      async ({ userId, type, startDate, endDate, days, note }) => {
        const req = await prisma.timeOffRequest.create({
          data: { userId, type, startDate: new Date(startDate), endDate: new Date(endDate), days, note: note || null },
        });
        return { content: [{ type: "text" as const, text: `Leave request created (ID: ${req.id}). Status: PENDING. ${type}, ${days} day(s) from ${startDate} to ${endDate}.` }] };
      }
    );

    server.tool(
      "get_my_latest_payslip",
      "Get an employee's most recent payslip with full salary breakdown.",
      { userId: z.string() },
      async ({ userId }) => {
        const payslip = await prisma.payslip.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: { payrun: true },
        });
        if (!payslip) return { content: [{ type: "text" as const, text: "No payslips found." }] };
        const text = `Payslip ${payslip.payrun.month}/${payslip.payrun.year}:\n- Gross: ${Number(payslip.grossWage).toLocaleString("en-IN")}\n- Basic: ${Number(payslip.basicSalary).toLocaleString("en-IN")}\n- HRA: ${Number(payslip.hra).toLocaleString("en-IN")}\n- PF: ${Number(payslip.pfEmployee).toLocaleString("en-IN")}\n- Prof Tax: ${Number(payslip.professionalTax).toLocaleString("en-IN")}\n- Net: ${Number(payslip.netWage).toLocaleString("en-IN")}\n- Status: ${payslip.status}`;
        return { content: [{ type: "text" as const, text }] };
      }
    );

    server.tool(
      "get_my_profile",
      "Get an employee's profile information.",
      { userId: z.string() },
      async ({ userId }) => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { company: true, salaryInfo: true },
        });
        if (!user) return { content: [{ type: "text" as const, text: "User not found." }] };
        return { content: [{ type: "text" as const, text: `Name: ${user.name}\nID: ${user.id}\nEmail: ${user.email}\nRole: ${user.role}\nDept: ${user.department || "N/A"}\nPosition: ${user.jobPosition || "N/A"}\nManager: ${user.managerId || "N/A"}\nCompany: ${user.company.name}\nJoined: ${fmt(user.dateOfJoining)}\nStatus: ${user.status}\nWage: ${user.salaryInfo ? Number(user.salaryInfo.monthlyWage).toLocaleString("en-IN") : "Not set"}` }] };
      }
    );

    server.tool(
      "get_working_hours_today",
      "Get an employee's working hours for today.",
      { userId: z.string() },
      async ({ userId }) => {
        const today = todayUTC();
        const record = await prisma.attendance.findUnique({
          where: { userId_date: { userId, date: today } },
        });
        if (!record) return { content: [{ type: "text" as const, text: "No attendance record for today." }] };
        const breaks = (record.breaks as any[]) || [];
        return { content: [{ type: "text" as const, text: `Today:\n- In: ${fmtTime(record.checkIn)}\n- Out: ${record.checkOut ? fmtTime(record.checkOut) : "Still working"}\n- Hours: ${Number(record.workHours ?? 0).toFixed(2)}\n- Breaks: ${breaks.length}` }] };
      }
    );

    server.tool(
      "get_my_manager",
      "Get info about an employee's manager.",
      { userId: z.string() },
      async ({ userId }) => {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { managerId: true } });
        if (!user?.managerId) return { content: [{ type: "text" as const, text: "No manager assigned." }] };
        const mgr = await prisma.user.findUnique({ where: { id: user.managerId }, select: { id: true, name: true, email: true, department: true, jobPosition: true } });
        if (!mgr) return { content: [{ type: "text" as const, text: "Manager not found." }] };
        return { content: [{ type: "text" as const, text: `Manager: ${mgr.name} (${mgr.id}), ${mgr.jobPosition || "N/A"}, ${mgr.department || "N/A"}, ${mgr.email}` }] };
      }
    );

    // ── HR / Admin ──

    server.tool(
      "get_employees_on_leave_today",
      "List employees on approved leave today.",
      { companyId: z.string() },
      async ({ companyId }) => {
        const today = todayUTC();
        const leaves = await prisma.timeOffRequest.findMany({
          where: { user: { companyId }, status: "APPROVED", startDate: { lte: today }, endDate: { gte: today } },
          include: { user: { select: { name: true, id: true, department: true } } },
        });
        if (!leaves.length) return { content: [{ type: "text" as const, text: "No employees on leave today." }] };
        return { content: [{ type: "text" as const, text: `On leave today (${leaves.length}):\n${leaves.map(l => `- ${l.user.name} (${l.user.id}) | ${l.type} | ${l.user.department || "N/A"}`).join("\n")}` }] };
      }
    );

    server.tool(
      "get_absent_employees",
      "List employees who have NOT checked in today.",
      { companyId: z.string() },
      async ({ companyId }) => {
        const today = todayUTC();
        const all = await prisma.user.findMany({ where: { companyId }, select: { id: true, name: true, department: true } });
        const checkedIn = await prisma.attendance.findMany({ where: { user: { companyId }, date: today }, select: { userId: true } });
        const ids = new Set(checkedIn.map(a => a.userId));
        const absent = all.filter(e => !ids.has(e.id));
        return { content: [{ type: "text" as const, text: `Absent today (${absent.length}/${all.length}):\n${absent.map(e => `- ${e.name} (${e.id}) | ${e.department || "N/A"}`).join("\n")}` }] };
      }
    );

    server.tool(
      "get_pending_leave_requests",
      "List all pending time-off requests in a company.",
      { companyId: z.string() },
      async ({ companyId }) => {
        const pending = await prisma.timeOffRequest.findMany({
          where: { user: { companyId }, status: "PENDING" },
          include: { user: { select: { name: true, id: true, department: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        if (!pending.length) return { content: [{ type: "text" as const, text: "No pending leave requests." }] };
        return { content: [{ type: "text" as const, text: `Pending requests (${pending.length}):\n${pending.map(r => `- ${r.user.name} | ${r.type} | ${fmt(r.startDate)} to ${fmt(r.endDate)} | ${Number(r.days)} day(s)`).join("\n")}` }] };
      }
    );

    server.tool(
      "get_attendance_summary",
      "Get attendance summary for a company/department for a given month.",
      { companyId: z.string(), year: z.number(), month: z.number(), department: z.string().optional() },
      async ({ companyId, year, month, department }) => {
        const { start, end } = monthRangeUTC(year, month);
        const where: any = { companyId };
        if (department) where.department = department;
        const employees = await prisma.user.findMany({ where, select: { id: true, name: true, department: true } });
        const records = await prisma.attendance.findMany({
          where: { userId: { in: employees.map(e => e.id) }, date: { gte: start, lte: end } },
        });
        const byUser = new Map<string, number>();
        for (const r of records) byUser.set(r.userId, (byUser.get(r.userId) || 0) + 1);
        const totalHours = records.reduce((s, r) => s + Number(r.workHours ?? 0), 0);
        const lines = employees.map(e => `- ${e.name} (${e.department || "N/A"}): ${byUser.get(e.id) || 0} days`);
        return { content: [{ type: "text" as const, text: `Summary ${month}/${year}${department ? ` (${department})` : ""}:\n- Employees: ${employees.length}\n- Records: ${records.length}\n- Total hours: ${totalHours.toFixed(1)}\n\n${lines.join("\n")}` }] };
      }
    );

    server.tool(
      "get_new_joiners",
      "List employees who joined in a given year.",
      { companyId: z.string(), year: z.number() },
      async ({ companyId, year }) => {
        const employees = await prisma.user.findMany({
          where: { companyId, joiningYear: year },
          select: { id: true, name: true, department: true, dateOfJoining: true, role: true },
          orderBy: { dateOfJoining: "asc" },
        });
        if (!employees.length) return { content: [{ type: "text" as const, text: `No employees joined in ${year}.` }] };
        return { content: [{ type: "text" as const, text: `Joined in ${year} (${employees.length}):\n${employees.map(e => `- ${e.name} (${e.id}) | ${e.role} | ${e.department || "N/A"} | ${fmt(e.dateOfJoining)}`).join("\n")}` }] };
      }
    );

    server.tool(
      "get_employee_attendance",
      "Get a specific employee's attendance for a given month.",
      { employeeId: z.string(), year: z.number(), month: z.number() },
      async ({ employeeId, year, month }) => {
        const { start, end } = monthRangeUTC(year, month);
        const records = await prisma.attendance.findMany({
          where: { userId: employeeId, date: { gte: start, lte: end } },
          orderBy: { date: "asc" },
          include: { user: { select: { name: true } } },
        });
        if (!records.length) return { content: [{ type: "text" as const, text: `No records for ${employeeId} in ${month}/${year}.` }] };
        const totalHours = records.reduce((s, r) => s + Number(r.workHours ?? 0), 0);
        const lines = records.map(r => `${fmt(r.date)} | In: ${fmtTime(r.checkIn)} | Out: ${fmtTime(r.checkOut)} | ${Number(r.workHours ?? 0).toFixed(1)}h`);
        return { content: [{ type: "text" as const, text: `${records[0].user.name} attendance ${month}/${year}:\n- Days: ${records.length}\n- Hours: ${totalHours.toFixed(1)}\n\n${lines.join("\n")}` }] };
      }
    );

    // ── Analytics ──

    server.tool(
      "get_employees_in_office",
      "Count employees currently checked in (in office).",
      { companyId: z.string() },
      async ({ companyId }) => {
        const count = await prisma.user.count({ where: { companyId, status: "IN_OFFICE" } });
        const total = await prisma.user.count({ where: { companyId } });
        return { content: [{ type: "text" as const, text: `In office: ${count}/${total} employees.` }] };
      }
    );

    server.tool(
      "get_top_overtime_employees",
      "Top employees by overtime hours for a given month.",
      { companyId: z.string(), year: z.number(), month: z.number(), limit: z.number().optional() },
      async ({ companyId, year, month, limit }) => {
        const { start, end } = monthRangeUTC(year, month);
        const records = await prisma.attendance.findMany({
          where: { user: { companyId }, date: { gte: start, lte: end } },
          include: { user: { select: { name: true, id: true } } },
        });
        const byUser = new Map<string, { name: string; hours: number }>();
        for (const r of records) {
          const cur = byUser.get(r.userId) || { name: r.user.name, hours: 0 };
          cur.hours += Number(r.extraHours ?? 0);
          byUser.set(r.userId, cur);
        }
        const sorted = [...byUser.entries()].sort((a, b) => b[1].hours - a[1].hours).slice(0, limit || 5);
        return { content: [{ type: "text" as const, text: `Top ${sorted.length} OT (${month}/${year}):\n${sorted.map(([id, d], i) => `${i + 1}. ${d.name} (${id}): ${d.hours.toFixed(1)}h`).join("\n")}` }] };
      }
    );

    server.tool(
      "get_total_payroll_cost",
      "Get total payroll cost for a given month/year.",
      { companyId: z.string(), year: z.number(), month: z.number() },
      async ({ companyId, year, month }) => {
        const payrun = await prisma.payrun.findUnique({
          where: { companyId_month_year: { companyId, month, year } },
          include: { payslips: true },
        });
        if (!payrun) return { content: [{ type: "text" as const, text: `No payrun for ${month}/${year}.` }] };
        const net = payrun.payslips.reduce((s, p) => s + Number(p.netWage), 0);
        const gross = payrun.payslips.reduce((s, p) => s + Number(p.grossWage), 0);
        const cost = payrun.payslips.reduce((s, p) => s + Number(p.employerCost), 0);
        return { content: [{ type: "text" as const, text: `Payroll ${month}/${year}:\n- Status: ${payrun.status}\n- Payslips: ${payrun.payslips.length}\n- Gross: ${gross.toLocaleString("en-IN")}\n- Net: ${net.toLocaleString("en-IN")}\n- Employer cost: ${cost.toLocaleString("en-IN")}` }] };
      }
    );

    server.tool(
      "get_department_stats",
      "Department-wise employee count and in-office stats.",
      { companyId: z.string() },
      async ({ companyId }) => {
        const employees = await prisma.user.findMany({ where: { companyId }, select: { department: true, status: true } });
        const depts = new Map<string, { total: number; inOffice: number }>();
        for (const e of employees) {
          const dept = e.department || "Unassigned";
          const cur = depts.get(dept) || { total: 0, inOffice: 0 };
          cur.total++;
          if (e.status === "IN_OFFICE") cur.inOffice++;
          depts.set(dept, cur);
        }
        return { content: [{ type: "text" as const, text: `Departments:\n${[...depts.entries()].map(([d, s]) => `- ${d}: ${s.total} total, ${s.inOffice} in office`).join("\n")}` }] };
      }
    );

    // ── Admin ──

    server.tool(
      "list_users_by_role",
      "List users with a specific role.",
      { companyId: z.string(), role: z.enum(["ADMIN", "HR_OFFICER", "PAYROLL_OFFICER", "EMPLOYEE"]) },
      async ({ companyId, role }) => {
        const users = await prisma.user.findMany({
          where: { companyId, role },
          select: { id: true, name: true, department: true, email: true },
        });
        if (!users.length) return { content: [{ type: "text" as const, text: `No users with role ${role}.` }] };
        return { content: [{ type: "text" as const, text: `${role} (${users.length}):\n${users.map(u => `- ${u.name} (${u.id}) | ${u.department || "N/A"} | ${u.email}`).join("\n")}` }] };
      }
    );

    server.tool(
      "get_company_stats",
      "Overall company statistics.",
      { companyId: z.string() },
      async ({ companyId }) => {
        const total = await prisma.user.count({ where: { companyId } });
        const byRole = await prisma.user.groupBy({ by: ["role"], where: { companyId }, _count: true });
        const inOffice = await prisma.user.count({ where: { companyId, status: "IN_OFFICE" } });
        const company = await prisma.company.findUnique({ where: { id: companyId } });
        return { content: [{ type: "text" as const, text: `${company?.name || "Company"}:\n- Total: ${total}\n- In office: ${inOffice}\n- Roles: ${byRole.map(r => `${r.role}: ${r._count}`).join(", ")}` }] };
      }
    );

    server.tool(
      "get_employees_without_salary",
      "Employees missing salary info configuration.",
      { companyId: z.string() },
      async ({ companyId }) => {
        const users = await prisma.user.findMany({
          where: { companyId, salaryInfo: null },
          select: { id: true, name: true, department: true },
        });
        if (!users.length) return { content: [{ type: "text" as const, text: "All employees have salary info." }] };
        return { content: [{ type: "text" as const, text: `Missing salary info (${users.length}):\n${users.map(u => `- ${u.name} (${u.id}) | ${u.department || "N/A"}`).join("\n")}` }] };
      }
    );

    server.tool(
      "search_employee",
      "Search for an employee by name or ID.",
      { companyId: z.string(), query: z.string() },
      async ({ companyId, query }) => {
        const users = await prisma.user.findMany({
          where: { companyId, OR: [{ name: { contains: query, mode: "insensitive" } }, { id: { contains: query, mode: "insensitive" } }] },
          select: { id: true, name: true, role: true, department: true, status: true, email: true },
          take: 10,
        });
        if (!users.length) return { content: [{ type: "text" as const, text: `No results for "${query}".` }] };
        return { content: [{ type: "text" as const, text: `Results for "${query}" (${users.length}):\n${users.map(u => `- ${u.name} (${u.id}) | ${u.role} | ${u.department || "N/A"} | ${u.status}`).join("\n")}` }] };
      }
    );
  },
  {},
  { basePath: "/api/mcp", verboseLogs: true }
);

export { handler as GET, handler as POST, handler as DELETE };
