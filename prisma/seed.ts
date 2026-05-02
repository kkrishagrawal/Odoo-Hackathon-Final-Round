import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const COMPANY_ID = "cmoo5tzca00020cu1yq9v6fso";
const PW_HASH = "$2b$12$oc2o2svadoQrzoI9RomNouf4o6ZTwzn4Mxt3eZI7ZkCXtcyObKjVC";

// ─── User definitions ────────────────────────────────────────
const users = [
  { id: "OIARSH20260004", name: "Arjun Sharma",    email: "arjun.sharma@empay.in",    role: "EMPLOYEE",         dept: "Engineering",  position: "Software Engineer",    gender: "Male",   dob: "1995-03-14", doj: "2026-01-10", manager: null, wage: 55000 },
  { id: "OIPRPA20260005", name: "Priya Patel",     email: "priya.patel@empay.in",     role: "EMPLOYEE",         dept: "Engineering",  position: "Frontend Developer",   gender: "Female", dob: "1997-07-22", doj: "2026-02-01", manager: null, wage: 48000 },
  { id: "OIRAGU20260006", name: "Rahul Gupta",     email: "rahul.gupta@empay.in",     role: "EMPLOYEE",         dept: "Marketing",    position: "Marketing Analyst",    gender: "Male",   dob: "1994-11-05", doj: "2026-01-15", manager: null, wage: 42000 },
  { id: "OISNRE20260007", name: "Sneha Reddy",     email: "sneha.reddy@empay.in",     role: "EMPLOYEE",         dept: "Design",       position: "UI/UX Designer",       gender: "Female", dob: "1996-09-18", doj: "2026-03-01", manager: null, wage: 50000 },
  { id: "OIVIJO20260008", name: "Vikram Joshi",    email: "vikram.joshi@empay.in",    role: "EMPLOYEE",         dept: "Engineering",  position: "Backend Developer",    gender: "Male",   dob: "1993-01-30", doj: "2026-01-05", manager: null, wage: 60000 },
  { id: "OIMENA20260009", name: "Meera Nair",      email: "meera.nair@empay.in",      role: "EMPLOYEE",         dept: "Finance",      position: "Accounts Executive",   gender: "Female", dob: "1998-12-02", doj: "2026-04-01", manager: null, wage: 38000 },
  { id: "OIKIDE20260010", name: "Kiran Desai",     email: "kiran.desai@empay.in",     role: "HR_OFFICER",       dept: "Human Resources", position: "HR Manager",        gender: "Male",   dob: "1991-06-10", doj: "2026-01-02", manager: null, wage: 65000 },
  { id: "OIANKU20260011", name: "Anita Kulkarni",  email: "anita.kulkarni@empay.in",  role: "HR_OFFICER",       dept: "Human Resources", position: "HR Executive",      gender: "Female", dob: "1995-04-25", doj: "2026-02-10", manager: "OIKIDE20260010", wage: 45000 },
  { id: "OIDEME20260012", name: "Deepak Mehta",    email: "deepak.mehta@empay.in",    role: "PAYROLL_OFFICER",  dept: "Finance",      position: "Payroll Manager",      gender: "Male",   dob: "1990-08-15", doj: "2026-01-03", manager: null, wage: 62000 },
  { id: "OIKASI20260013", name: "Kavita Singh",    email: "kavita.singh@empay.in",    role: "PAYROLL_OFFICER",  dept: "Finance",      position: "Payroll Analyst",      gender: "Female", dob: "1996-02-28", doj: "2026-03-15", manager: "OIDEME20260012", wage: 44000 },
];

// ─── Bank details ────────────────────────────────────────────
const bankData = [
  { userId: "OIARSH20260004", acc: "10234567890", bank: "State Bank of India",    ifsc: "SBIN0001234", pan: "ABCPA1234A", uan: "100123456789" },
  { userId: "OIPRPA20260005", acc: "20345678901", bank: "HDFC Bank",              ifsc: "HDFC0002345", pan: "BCDPB2345B", uan: "100234567890" },
  { userId: "OIRAGU20260006", acc: "30456789012", bank: "ICICI Bank",             ifsc: "ICIC0003456", pan: "CDEPC3456C", uan: "100345678901" },
  { userId: "OISNRE20260007", acc: "40567890123", bank: "Axis Bank",              ifsc: "UTIB0004567", pan: "DEFPD4567D", uan: "100456789012" },
  { userId: "OIVIJO20260008", acc: "50678901234", bank: "Kotak Mahindra Bank",    ifsc: "KKBK0005678", pan: "EFGPE5678E", uan: "100567890123" },
  { userId: "OIMENA20260009", acc: "60789012345", bank: "Punjab National Bank",   ifsc: "PUNB0006789", pan: "FGHPF6789F", uan: "100678901234" },
  { userId: "OIKIDE20260010", acc: "70890123456", bank: "Bank of Baroda",         ifsc: "BARB0007890", pan: "GHIPG7890G", uan: "100789012345" },
  { userId: "OIANKU20260011", acc: "80901234567", bank: "Canara Bank",            ifsc: "CNRB0008901", pan: "HIJPH8901H", uan: "100890123456" },
  { userId: "OIDEME20260012", acc: "90012345678", bank: "Union Bank of India",    ifsc: "UBIN0009012", pan: "IJKPI9012I", uan: "100901234567" },
  { userId: "OIKASI20260013", acc: "10123456789", bank: "Indian Bank",            ifsc: "IDIB0010123", pan: "JKLPJ0123J", uan: "101012345678" },
];

// ─── Skills ──────────────────────────────────────────────────
const skillsData = {
  OIARSH20260004: ["JavaScript", "TypeScript", "React", "Node.js"],
  OIPRPA20260005: ["React", "CSS", "Figma", "TailwindCSS"],
  OIRAGU20260006: ["SEO", "Google Analytics", "Content Strategy"],
  OISNRE20260007: ["Figma", "Adobe XD", "Sketch", "User Research"],
  OIVIJO20260008: ["Python", "PostgreSQL", "Docker", "AWS"],
  OIMENA20260009: ["Excel", "Tally", "GST Filing", "SAP"],
  OIKIDE20260010: ["Recruitment", "Employee Relations", "HRIS", "Compliance"],
  OIANKU20260011: ["Onboarding", "Payroll Basics", "MS Office"],
  OIDEME20260012: ["Payroll Processing", "Tax Compliance", "SAP HCM", "Excel VBA"],
  OIKASI20260013: ["Payroll Auditing", "Statutory Compliance", "Tally Prime"],
};

// ─── Certifications ──────────────────────────────────────────
const certsData = {
  OIARSH20260004: [{ name: "AWS Certified Developer", issuer: "Amazon Web Services", year: 2025 }],
  OIPRPA20260005: [{ name: "Meta Frontend Developer", issuer: "Meta", year: 2025 }],
  OIRAGU20260006: [{ name: "Google Analytics Certified", issuer: "Google", year: 2024 }],
  OISNRE20260007: [{ name: "Google UX Design Certificate", issuer: "Google", year: 2025 }, { name: "Interaction Design Foundation", issuer: "IDF", year: 2024 }],
  OIVIJO20260008: [{ name: "Certified Kubernetes Administrator", issuer: "CNCF", year: 2025 }],
  OIMENA20260009: [{ name: "Chartered Accountant Foundation", issuer: "ICAI", year: 2023 }],
  OIKIDE20260010: [{ name: "SHRM-CP", issuer: "SHRM", year: 2024 }, { name: "PHR", issuer: "HRCI", year: 2023 }],
  OIANKU20260011: [{ name: "CHRP", issuer: "HRCI", year: 2025 }],
  OIDEME20260012: [{ name: "Certified Payroll Professional", issuer: "APA", year: 2024 }],
  OIKASI20260013: [{ name: "Diploma in Taxation", issuer: "ICSI", year: 2025 }],
};

// ─── Attendance helper ───────────────────────────────────────
function makeAttendance(userId: string, dateStr: string, checkInH: number, checkInM: number, checkOutH: number | null, checkOutM: number | null, breaks: number[][]) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  const checkIn = new Date(Date.UTC(y, m - 1, d, checkInH, checkInM, 0));
  const checkOut = checkOutH != null ? new Date(Date.UTC(y, m - 1, d, checkOutH, checkOutM as number, 0)) : null;

  let totalBreakMs = 0;
  const breakEntries = (breaks || []).map((b: number[]) => {
    const pausedAt = new Date(Date.UTC(y, m - 1, d, b[0], b[1], 0));
    const resumedAt = new Date(Date.UTC(y, m - 1, d, b[2], b[3], 0));
    totalBreakMs += resumedAt.getTime() - pausedAt.getTime();
    return { pausedAt: pausedAt.toISOString(), resumedAt: resumedAt.toISOString() };
  });

  let workHours = 0;
  let extraHours = 0;
  if (checkOut) {
    const totalMs = checkOut.getTime() - checkIn.getTime() - totalBreakMs;
    workHours = Math.max(0, parseFloat((totalMs / 3600000).toFixed(2)));
    extraHours = Math.max(0, parseFloat((workHours - 8).toFixed(2)));
  }

  return { userId, date, checkIn, checkOut, workHours, extraHours, breaks: breakEntries };
}

// ─── Time-off requests ───────────────────────────────────────
const timeOffRequests = [
  { userId: "OIARSH20260004", type: "PAID",   startDate: "2026-05-10", endDate: "2026-05-12", days: 3, status: "PENDING",  note: "Family function" },
  { userId: "OIPRPA20260005", type: "SICK",   startDate: "2026-05-05", endDate: "2026-05-06", days: 2, status: "APPROVED", note: "Fever and cold", reviewedBy: "OIKIDE20260010" },
  { userId: "OIRAGU20260006", type: "UNPAID", startDate: "2026-05-15", endDate: "2026-05-15", days: 1, status: "PENDING",  note: "Personal errand" },
  { userId: "OISNRE20260007", type: "PAID",   startDate: "2026-05-20", endDate: "2026-05-22", days: 3, status: "APPROVED", note: "Vacation", reviewedBy: "OIKIDE20260010" },
  { userId: "OIVIJO20260008", type: "SICK",   startDate: "2026-05-08", endDate: "2026-05-09", days: 2, status: "REJECTED", note: "Headache", reviewedBy: "OIANKU20260011" },
  { userId: "OIMENA20260009", type: "PAID",   startDate: "2026-05-25", endDate: "2026-05-27", days: 3, status: "PENDING",  note: "Wedding in family" },
  { userId: "OIKIDE20260010", type: "PAID",   startDate: "2026-05-18", endDate: "2026-05-19", days: 2, status: "APPROVED", note: "Conference travel", reviewedBy: "OIANKU20260011" },
  { userId: "OIANKU20260011", type: "SICK",   startDate: "2026-05-03", endDate: "2026-05-04", days: 2, status: "PENDING",  note: "Doctor appointment" },
];

// ─── Payslip computation helper ──────────────────────────────
function computePayslip(wage: number, attendanceDays: number, paidLeaveDays: number, unpaidLeaveDays: number) {
  const totalPayableDays = attendanceDays + paidLeaveDays;
  const basicPct = 50, hraPct = 50, bonusPct = 8.33, ltaPct = 8.33;
  const basicSalary = round(wage * basicPct / 100);
  const hra = round(basicSalary * hraPct / 100);
  const bonus = round(basicSalary * bonusPct / 100);
  const lta = round(basicSalary * ltaPct / 100);
  const standardAllowance = 0;
  const fixedAllowance = round(wage - basicSalary - hra - bonus - lta - standardAllowance);
  const grossWage = wage;
  const pfEmployee = round(basicSalary * 12 / 100);
  const pfEmployer = round(basicSalary * 12 / 100);
  const professionalTax = 200;
  const tdsDeduction = 0;
  const totalDeductions = round(pfEmployee + professionalTax + tdsDeduction);
  const netWage = round(grossWage - totalDeductions);
  const employerCost = round(wage + pfEmployer);

  return {
    attendanceDays, paidLeaveDays, unpaidLeaveDays, totalPayableDays,
    monthlyWage: wage, basicSalary, hra, standardAllowance, bonus, lta,
    fixedAllowance, grossWage, pfEmployee, pfEmployer, professionalTax,
    tdsDeduction, totalDeductions, netWage, employerCost,
  };
}

function round(n: number) { return parseFloat(n.toFixed(2)); }

// ─── Main seed ───────────────────────────────────────────────
async function main() {
  console.log("Seeding 10 new users and related data...\n");

  // 1. Create users (upsert to avoid conflicts)
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: PW_HASH,
        role: u.role as any,
        companyId: COMPANY_ID,
        department: u.dept,
        jobPosition: u.position,
        location: "Mumbai, India",
        managerId: u.manager,
        dateOfJoining: new Date(u.doj),
        joiningYear: 2026,
        dateOfBirth: new Date(u.dob),
        residingAddress: "Mumbai, Maharashtra, India",
        nationality: "Indian",
        gender: u.gender,
        maritalStatus: u.gender === "Male" ? "Single" : "Single",
        about: `${u.name} is a dedicated ${u.position} at EmPay.`,
        status: "ABSENT",
      },
    });
    console.log(`  User: ${u.id} - ${u.name} (${u.role})`);
  }

  // 2. Bank details
  for (const b of bankData) {
    await prisma.bankDetails.upsert({
      where: { userId: b.userId },
      update: {},
      create: {
        userId: b.userId,
        accountNumber: b.acc,
        bankName: b.bank,
        ifscCode: b.ifsc,
        panNumber: b.pan,
        uanNumber: b.uan,
        employeeCode: b.userId,
      },
    });
  }
  console.log("  Bank details created.");

  // 3. Salary info
  for (const u of users) {
    await prisma.salaryInfo.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        monthlyWage: u.wage,
        workingDaysPerWeek: 5,
        breakTimeHrs: 1,
        basicSalaryPct: 50,
        hraPct: 50,
        standardAllowance: 0,
        bonusPct: 8.33,
        ltaPct: 8.33,
      },
    });
  }
  console.log("  Salary info created.");

  // 4. Skills
  for (const [userId, skills] of Object.entries(skillsData)) {
    for (const name of skills) {
      await prisma.skill.create({ data: { userId, name } });
    }
  }
  console.log("  Skills created.");

  // 5. Certifications
  for (const [userId, certs] of Object.entries(certsData)) {
    for (const c of certs) {
      await prisma.certification.create({ data: { userId, name: c.name, issuer: c.issuer, year: c.year } });
    }
  }
  console.log("  Certifications created.");

  // 6. Attendance — May 1 and May 2 for all users
  const attendanceRecords = [
    // May 1 (all users, various check-in times, some with breaks)
    makeAttendance("OIARSH20260004", "2026-05-01", 9, 0, 18, 15, [[12, 30, 13, 0], [15, 0, 15, 15]]),
    makeAttendance("OIPRPA20260005", "2026-05-01", 9, 30, 17, 45, [[13, 0, 13, 30]]),
    makeAttendance("OIRAGU20260006", "2026-05-01", 10, 0, 18, 30, [[12, 45, 13, 15], [16, 0, 16, 10]]),
    makeAttendance("OISNRE20260007", "2026-05-01", 9, 15, 17, 30, [[12, 30, 13, 0]]),
    makeAttendance("OIVIJO20260008", "2026-05-01", 8, 45, 19, 0, [[12, 0, 12, 30], [15, 30, 15, 45], [17, 0, 17, 10]]),
    makeAttendance("OIMENA20260009", "2026-05-01", 9, 45, 17, 15, [[13, 0, 13, 20]]),
    makeAttendance("OIKIDE20260010", "2026-05-01", 8, 30, 18, 0, [[12, 30, 13, 0]]),
    makeAttendance("OIANKU20260011", "2026-05-01", 9, 0, 17, 30, [[12, 30, 13, 0], [15, 15, 15, 30]]),
    makeAttendance("OIDEME20260012", "2026-05-01", 8, 45, 18, 30, [[12, 0, 12, 30], [16, 0, 16, 15]]),
    makeAttendance("OIKASI20260013", "2026-05-01", 9, 15, 17, 45, [[13, 0, 13, 15]]),

    // May 2 (all users, slightly different patterns)
    makeAttendance("OIARSH20260004", "2026-05-02", 9, 10, 18, 0, [[12, 30, 13, 0]]),
    makeAttendance("OIPRPA20260005", "2026-05-02", 9, 45, 17, 30, [[13, 0, 13, 30], [15, 45, 16, 0]]),
    makeAttendance("OIRAGU20260006", "2026-05-02", 10, 15, 18, 45, [[13, 0, 13, 30]]),
    makeAttendance("OISNRE20260007", "2026-05-02", 9, 0, 17, 45, [[12, 30, 13, 0], [16, 0, 16, 10]]),
    makeAttendance("OIVIJO20260008", "2026-05-02", 8, 30, 18, 45, [[12, 0, 12, 45], [15, 0, 15, 15]]),
    makeAttendance("OIMENA20260009", "2026-05-02", 9, 30, 17, 0, [[12, 45, 13, 0]]),
    makeAttendance("OIKIDE20260010", "2026-05-02", 8, 45, 18, 15, [[12, 30, 13, 0], [15, 30, 15, 45]]),
    makeAttendance("OIANKU20260011", "2026-05-02", 9, 15, 17, 15, [[12, 30, 13, 0]]),
    makeAttendance("OIDEME20260012", "2026-05-02", 9, 0, 18, 0, [[12, 0, 12, 30]]),
    makeAttendance("OIKASI20260013", "2026-05-02", 9, 30, 17, 30, [[13, 0, 13, 15], [15, 30, 15, 40]]),
  ];

  for (const a of attendanceRecords) {
    await prisma.attendance.upsert({
      where: { userId_date: { userId: a.userId, date: a.date } },
      update: {},
      create: a,
    });
  }
  console.log("  Attendance records created (20 records, 2 days x 10 users).");

  // 7. Time-off requests
  for (const t of timeOffRequests) {
    await prisma.timeOffRequest.create({
      data: {
        userId: t.userId,
        type: t.type as any,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
        days: t.days,
        status: t.status as any,
        note: t.note,
        reviewedBy: t.reviewedBy || null,
        reviewedAt: t.reviewedBy ? new Date() : null,
      },
    });
  }
  console.log("  Time-off requests created (8 requests).");

  // 8. Payrun + Payslips for May 2026
  const payrun = await prisma.payrun.upsert({
    where: { companyId_month_year: { companyId: COMPANY_ID, month: 5, year: 2026 } },
    update: {},
    create: { companyId: COMPANY_ID, month: 5, year: 2026, status: "COMPUTED" },
  });
  console.log(`  Payrun created: ${payrun.id} (May 2026)`);

  for (const u of users) {
    const ps = computePayslip(u.wage, 2, 0, 0);
    await prisma.payslip.upsert({
      where: { payrunId_userId: { payrunId: payrun.id, userId: u.id } },
      update: {},
      create: {
        payrunId: payrun.id,
        userId: u.id,
        salaryStructure: "Regular Pay",
        status: "COMPUTED",
        ...ps,
      },
    });
  }
  console.log("  Payslips created (10 payslips).");

  // 9. Update JoiningSerial
  await prisma.joiningSerial.upsert({
    where: { companyId_year: { companyId: COMPANY_ID, year: 2026 } },
    update: { lastSerial: 13 },
    create: { companyId: COMPANY_ID, year: 2026, lastSerial: 13 },
  });
  console.log("  JoiningSerial updated to 13.");

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
