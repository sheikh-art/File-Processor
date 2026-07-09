/**
 * Seed script — populates the database with realistic sample data.
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm --filter @workspace/scripts run seed
 *
 * Environment variables:
 *   ADMIN_USERNAME  (default: "admin")
 *   ADMIN_PASSWORD  (default: "changeme123")  ← change before going to production!
 *   ADMIN_NAME      (default: "Administrator")
 */

import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  branchesTable,
  customersTable,
  collectorsTable,
  committeesTable,
  committeeMembersTable,
  tokensTable,
  loansTable,
  collectionsTable,
  lotteriesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

// ─── 1. Admin user ────────────────────────────────────────────────────────────

const username = process.env.ADMIN_USERNAME ?? "admin";
const password = process.env.ADMIN_PASSWORD ?? "changeme123";
const name = process.env.ADMIN_NAME ?? "Administrator";

if (password === "changeme123") {
  console.warn(
    "\n⚠️  WARNING: Using default password 'changeme123'. " +
    "Set ADMIN_PASSWORD env var before running in production!\n"
  );
}

console.log(`\n── Seeding admin user: ${username}`);
const passwordHash = await bcrypt.hash(password, 12);
const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
if (existing.length > 0) {
  await db.update(usersTable).set({ passwordHash, name, role: "super_admin" }).where(eq(usersTable.username, username));
  console.log(`  ✓ Updated existing user '${username}'.`);
} else {
  await db.insert(usersTable).values({ username, passwordHash, name, role: "super_admin" });
  console.log(`  ✓ Created user '${username}'.`);
}

// ─── 2. Branches ─────────────────────────────────────────────────────────────

console.log("\n── Seeding branches");
const [bMumbai, bDelhi, bBangalore] = await db
  .insert(branchesTable)
  .values([
    {
      name: "Mumbai Main Branch",
      code: "MUM001",
      city: "Mumbai",
      address: "Shop No. 12, Dadar West, Mumbai - 400028",
      phone: "022-24381234",
      managerName: "Rajesh Sharma",
      status: "active",
    },
    {
      name: "Delhi Central Branch",
      code: "DEL001",
      city: "Delhi",
      address: "Plot 45, Connaught Place, New Delhi - 110001",
      phone: "011-23410987",
      managerName: "Sunita Verma",
      status: "active",
    },
    {
      name: "Bangalore South Branch",
      code: "BLR001",
      city: "Bangalore",
      address: "No. 8, Jayanagar 4th Block, Bengaluru - 560011",
      phone: "080-26562345",
      managerName: "Venkatesh Rao",
      status: "active",
    },
  ])
  .returning();
console.log(`  ✓ Created ${3} branches.`);

// ─── 3. Customers ─────────────────────────────────────────────────────────────

console.log("\n── Seeding customers");
const customerRows = await db
  .insert(customersTable)
  .values([
    // Mumbai customers
    {
      referenceNumber: "MUM-C001",
      name: "Amit Kumar",
      mobile: "9820001111",
      alternateMobile: "9820001112",
      email: "amit.kumar@gmail.com",
      aadhaar: "2345 6789 0123",
      pan: "AMTPK1234A",
      address: "101, Sai Niwas, Worli, Mumbai",
      city: "Mumbai",
      nomineeName: "Priya Kumar",
      nomineeRelation: "Wife",
      branchId: bMumbai.id,
      status: "active",
    },
    {
      referenceNumber: "MUM-C002",
      name: "Sunita Patil",
      mobile: "9821002222",
      email: "sunita.patil@yahoo.com",
      aadhaar: "3456 7890 1234",
      address: "22, Shivaji Nagar, Pune Road, Mumbai",
      city: "Mumbai",
      nomineeName: "Ramesh Patil",
      nomineeRelation: "Husband",
      branchId: bMumbai.id,
      status: "active",
    },
    {
      referenceNumber: "MUM-C003",
      name: "Deepak Joshi",
      mobile: "9822003333",
      email: "deepak.joshi@gmail.com",
      pan: "DJPK5678B",
      address: "Flat 5B, Andheri East, Mumbai",
      city: "Mumbai",
      branchId: bMumbai.id,
      status: "active",
    },
    {
      referenceNumber: "MUM-C004",
      name: "Kavita Mehta",
      mobile: "9823004444",
      address: "Plot 33, Borivali West, Mumbai",
      city: "Mumbai",
      nomineeName: "Suresh Mehta",
      nomineeRelation: "Son",
      branchId: bMumbai.id,
      status: "active",
    },
    {
      referenceNumber: "MUM-C005",
      name: "Rohit Nair",
      mobile: "9824005555",
      alternateMobile: "9824005556",
      email: "rohit.nair@hotmail.com",
      aadhaar: "5678 9012 3456",
      address: "7, Marine Lines, Mumbai",
      city: "Mumbai",
      branchId: bMumbai.id,
      status: "active",
    },
    // Delhi customers
    {
      referenceNumber: "DEL-C001",
      name: "Pooja Sharma",
      mobile: "9910001111",
      email: "pooja.sharma@gmail.com",
      aadhaar: "6789 0123 4567",
      pan: "PJSM2345C",
      address: "House No. 14, Lajpat Nagar, New Delhi",
      city: "Delhi",
      nomineeName: "Vikram Sharma",
      nomineeRelation: "Brother",
      branchId: bDelhi.id,
      status: "active",
    },
    {
      referenceNumber: "DEL-C002",
      name: "Manoj Gupta",
      mobile: "9911002222",
      address: "88, Karol Bagh, New Delhi",
      city: "Delhi",
      branchId: bDelhi.id,
      status: "active",
    },
    {
      referenceNumber: "DEL-C003",
      name: "Anita Singh",
      mobile: "9912003333",
      email: "anita.singh@gmail.com",
      aadhaar: "8901 2345 6789",
      address: "12, Vasant Kunj, New Delhi",
      city: "Delhi",
      nomineeName: "Sanjay Singh",
      nomineeRelation: "Husband",
      branchId: bDelhi.id,
      status: "active",
    },
    {
      referenceNumber: "DEL-C004",
      name: "Rahul Verma",
      mobile: "9913004444",
      pan: "RLVM6789D",
      address: "23, Dwarka Sector 6, New Delhi",
      city: "Delhi",
      branchId: bDelhi.id,
      status: "active",
    },
    // Bangalore customers
    {
      referenceNumber: "BLR-C001",
      name: "Suresh Reddy",
      mobile: "9980001111",
      email: "suresh.reddy@gmail.com",
      aadhaar: "1234 5678 9012",
      pan: "SRRD1234E",
      address: "15, Indiranagar, Bengaluru",
      city: "Bangalore",
      nomineeName: "Lakshmi Reddy",
      nomineeRelation: "Wife",
      branchId: bBangalore.id,
      status: "active",
    },
    {
      referenceNumber: "BLR-C002",
      name: "Meera Rao",
      mobile: "9981002222",
      alternateMobile: "9981002223",
      email: "meera.rao@yahoo.com",
      address: "88, Koramangala 5th Block, Bengaluru",
      city: "Bangalore",
      branchId: bBangalore.id,
      status: "active",
    },
    {
      referenceNumber: "BLR-C003",
      name: "Kiran Kumar",
      mobile: "9982003333",
      email: "kiran.kumar@gmail.com",
      aadhaar: "3456 7890 1235",
      address: "44, HSR Layout, Bengaluru",
      city: "Bangalore",
      nomineeName: "Geetha Kumar",
      nomineeRelation: "Mother",
      branchId: bBangalore.id,
      status: "active",
    },
    {
      referenceNumber: "BLR-C004",
      name: "Priya Nair",
      mobile: "9983004444",
      pan: "PRNR4567F",
      address: "9, JP Nagar, Bengaluru",
      city: "Bangalore",
      branchId: bBangalore.id,
      status: "active",
    },
  ])
  .returning();
console.log(`  ✓ Created ${customerRows.length} customers.`);

const [cAmit, cSunita, cDeepa, cKavita, cRohit, cPooja, cManoj, cAnita, cRahul, cSuresh, cMeera, cKiran, cPriya] = customerRows;

// ─── 4. Collectors ────────────────────────────────────────────────────────────

console.log("\n── Seeding collectors");
const collectorRows = await db
  .insert(collectorsTable)
  .values([
    { name: "Vikram Desai",   mobile: "9870111000", email: "vikram.desai@bissi.in",   branchId: bMumbai.id,    status: "active" },
    { name: "Prachi Kulkarni", mobile: "9870222000", email: "prachi.k@bissi.in",       branchId: bMumbai.id,    status: "active" },
    { name: "Sunil Yadav",    mobile: "9810333000", email: "sunil.yadav@bissi.in",     branchId: bDelhi.id,     status: "active" },
    { name: "Lakshmi Devi",   mobile: "9900444000", email: "lakshmi.devi@bissi.in",    branchId: bBangalore.id, status: "active" },
  ])
  .returning();
console.log(`  ✓ Created ${collectorRows.length} collectors.`);
const [colVikram, colPrachi, colSunil, colLakshmi] = collectorRows;

// ─── 5. Committees ────────────────────────────────────────────────────────────

console.log("\n── Seeding committees");
const committeeRows = await db
  .insert(committeesTable)
  .values([
    {
      name: "Mumbai Monthly 5000",
      type: "monthly",
      installmentAmount: "5000.00",
      memberLimit: 20,
      drawDate: "2025-01-01",
      status: "active",
      branchId: bMumbai.id,
    },
    {
      name: "Mumbai Daily 200",
      type: "daily",
      installmentAmount: "200.00",
      memberLimit: 30,
      status: "active",
      branchId: bMumbai.id,
    },
    {
      name: "Delhi Monthly 10000",
      type: "monthly",
      installmentAmount: "10000.00",
      memberLimit: 12,
      drawDate: "2025-03-01",
      status: "active",
      branchId: bDelhi.id,
    },
    {
      name: "Bangalore Weekly 1000",
      type: "weekly",
      installmentAmount: "1000.00",
      memberLimit: 25,
      status: "active",
      branchId: bBangalore.id,
    },
    {
      name: "Diwali Festival Special",
      type: "festival",
      installmentAmount: "2000.00",
      memberLimit: 15,
      drawDate: "2024-11-01",
      status: "completed",
      branchId: bMumbai.id,
    },
  ])
  .returning();
console.log(`  ✓ Created ${committeeRows.length} committees.`);
const [comMumMonthly, comMumDaily, comDelMonthly, comBlrWeekly, comFestival] = committeeRows;

// ─── 6. Committee members + tokens ────────────────────────────────────────────

console.log("\n── Seeding committee members & tokens");

// Mumbai Monthly 5000 — 5 members
await db.insert(committeeMembersTable).values([
  { committeeId: comMumMonthly.id, customerId: cAmit.id,   tokenNumber: "T001", status: "active" },
  { committeeId: comMumMonthly.id, customerId: cSunita.id, tokenNumber: "T002", status: "active" },
  { committeeId: comMumMonthly.id, customerId: cDeepa.id,  tokenNumber: "T003", status: "active" },
  { committeeId: comMumMonthly.id, customerId: cKavita.id, tokenNumber: "T004", status: "active" },
  { committeeId: comMumMonthly.id, customerId: cRohit.id,  tokenNumber: "T005", status: "active" },
]);
await db.insert(tokensTable).values([
  { tokenNumber: "T001", customerId: cAmit.id,   committeeId: comMumMonthly.id, status: "active" },
  { tokenNumber: "T002", customerId: cSunita.id, committeeId: comMumMonthly.id, status: "active" },
  { tokenNumber: "T003", customerId: cDeepa.id,  committeeId: comMumMonthly.id, status: "active" },
  { tokenNumber: "T004", customerId: cKavita.id, committeeId: comMumMonthly.id, status: "active" },
  { tokenNumber: "T005", customerId: cRohit.id,  committeeId: comMumMonthly.id, status: "active" },
]);

// Delhi Monthly 10000 — 4 members
await db.insert(committeeMembersTable).values([
  { committeeId: comDelMonthly.id, customerId: cPooja.id, tokenNumber: "T001", status: "active" },
  { committeeId: comDelMonthly.id, customerId: cManoj.id, tokenNumber: "T002", status: "active" },
  { committeeId: comDelMonthly.id, customerId: cAnita.id, tokenNumber: "T003", status: "active" },
  { committeeId: comDelMonthly.id, customerId: cRahul.id, tokenNumber: "T004", status: "active" },
]);
await db.insert(tokensTable).values([
  { tokenNumber: "T001", customerId: cPooja.id, committeeId: comDelMonthly.id, status: "active" },
  { tokenNumber: "T002", customerId: cManoj.id, committeeId: comDelMonthly.id, status: "active" },
  { tokenNumber: "T003", customerId: cAnita.id, committeeId: comDelMonthly.id, status: "active" },
  { tokenNumber: "T004", customerId: cRahul.id, committeeId: comDelMonthly.id, status: "active" },
]);

// Bangalore Weekly 1000 — 4 members
await db.insert(committeeMembersTable).values([
  { committeeId: comBlrWeekly.id, customerId: cSuresh.id, tokenNumber: "T001", status: "active" },
  { committeeId: comBlrWeekly.id, customerId: cMeera.id,  tokenNumber: "T002", status: "active" },
  { committeeId: comBlrWeekly.id, customerId: cKiran.id,  tokenNumber: "T003", status: "active" },
  { committeeId: comBlrWeekly.id, customerId: cPriya.id,  tokenNumber: "T004", status: "active" },
]);
await db.insert(tokensTable).values([
  { tokenNumber: "T001", customerId: cSuresh.id, committeeId: comBlrWeekly.id, status: "active" },
  { tokenNumber: "T002", customerId: cMeera.id,  committeeId: comBlrWeekly.id, status: "active" },
  { tokenNumber: "T003", customerId: cKiran.id,  committeeId: comBlrWeekly.id, status: "active" },
  { tokenNumber: "T004", customerId: cPriya.id,  committeeId: comBlrWeekly.id, status: "active" },
]);

// Festival committee — 3 members (closed)
await db.insert(committeeMembersTable).values([
  { committeeId: comFestival.id, customerId: cAmit.id,   tokenNumber: "T001", status: "active" },
  { committeeId: comFestival.id, customerId: cSunita.id, tokenNumber: "T002", status: "active" },
  { committeeId: comFestival.id, customerId: cRohit.id,  tokenNumber: "T003", status: "active" },
]);
await db.insert(tokensTable).values([
  { tokenNumber: "T001", customerId: cAmit.id,   committeeId: comFestival.id, status: "closed" },
  { tokenNumber: "T002", customerId: cSunita.id, committeeId: comFestival.id, status: "closed" },
  { tokenNumber: "T003", customerId: cRohit.id,  committeeId: comFestival.id, status: "closed" },
]);
console.log("  ✓ Created committee members & tokens.");

// ─── 7. Loans ─────────────────────────────────────────────────────────────────

console.log("\n── Seeding loans");
await db.insert(loansTable).values([
  {
    customerId: cAmit.id,
    principalAmount: "50000.00",
    interestRate: "2.00",
    interestType: "flat",
    tenure: 12,
    emiAmount: "4583.00",
    totalAmount: "55000.00",
    paidAmount: "18332.00",
    status: "active",
    branchId: bMumbai.id,
    purpose: "Home renovation",
    disbursedAt: new Date("2024-10-01"),
    dueDate: "2025-10-01",
  },
  {
    customerId: cSunita.id,
    principalAmount: "25000.00",
    interestRate: "1.50",
    interestType: "flat",
    tenure: 6,
    emiAmount: "4479.00",
    totalAmount: "26875.00",
    paidAmount: "26875.00",
    status: "closed",
    branchId: bMumbai.id,
    purpose: "Medical expenses",
    disbursedAt: new Date("2024-04-01"),
    dueDate: "2024-10-01",
  },
  {
    customerId: cPooja.id,
    principalAmount: "100000.00",
    interestRate: "1.75",
    interestType: "reducing",
    tenure: 24,
    emiAmount: "5030.00",
    totalAmount: "120720.00",
    paidAmount: "15090.00",
    status: "active",
    branchId: bDelhi.id,
    purpose: "Business expansion",
    disbursedAt: new Date("2024-12-01"),
    dueDate: "2026-12-01",
  },
  {
    customerId: cSuresh.id,
    principalAmount: "30000.00",
    interestRate: "2.00",
    interestType: "flat",
    tenure: 10,
    emiAmount: "3600.00",
    totalAmount: "36000.00",
    paidAmount: "0.00",
    status: "approved",
    branchId: bBangalore.id,
    purpose: "Education fees",
    dueDate: "2025-11-01",
  },
  {
    customerId: cKiran.id,
    principalAmount: "15000.00",
    interestRate: "2.50",
    interestType: "flat",
    tenure: 5,
    emiAmount: "3375.00",
    totalAmount: "16875.00",
    paidAmount: "3375.00",
    status: "overdue",
    branchId: bBangalore.id,
    purpose: "Vehicle repair",
    disbursedAt: new Date("2024-08-01"),
    dueDate: "2025-01-01",
  },
]);
console.log("  ✓ Created 5 loans.");

// ─── 8. Collections ───────────────────────────────────────────────────────────

console.log("\n── Seeding collections");
await db.insert(collectionsTable).values([
  // Mumbai Monthly committee installments
  { customerId: cAmit.id,   collectorId: colVikram.id, branchId: bMumbai.id, committeeId: comMumMonthly.id, amount: "5000.00", paymentMode: "cash",  receiptNumber: "RCP-MUM-0001", collectedAt: new Date("2025-01-05") },
  { customerId: cSunita.id, collectorId: colVikram.id, branchId: bMumbai.id, committeeId: comMumMonthly.id, amount: "5000.00", paymentMode: "upi",   receiptNumber: "RCP-MUM-0002", collectedAt: new Date("2025-01-06") },
  { customerId: cDeepa.id,  collectorId: colPrachi.id, branchId: bMumbai.id, committeeId: comMumMonthly.id, amount: "5000.00", paymentMode: "bank",  receiptNumber: "RCP-MUM-0003", collectedAt: new Date("2025-01-07") },
  { customerId: cKavita.id, collectorId: colPrachi.id, branchId: bMumbai.id, committeeId: comMumMonthly.id, amount: "5000.00", paymentMode: "cash",  receiptNumber: "RCP-MUM-0004", collectedAt: new Date("2025-01-07") },
  { customerId: cRohit.id,  collectorId: colVikram.id, branchId: bMumbai.id, committeeId: comMumMonthly.id, amount: "5000.00", paymentMode: "upi",   receiptNumber: "RCP-MUM-0005", collectedAt: new Date("2025-01-08") },
  // February instalment
  { customerId: cAmit.id,   collectorId: colVikram.id, branchId: bMumbai.id, committeeId: comMumMonthly.id, amount: "5000.00", paymentMode: "cash",  receiptNumber: "RCP-MUM-0006", collectedAt: new Date("2025-02-05") },
  { customerId: cSunita.id, collectorId: colVikram.id, branchId: bMumbai.id, committeeId: comMumMonthly.id, amount: "5000.00", paymentMode: "upi",   receiptNumber: "RCP-MUM-0007", collectedAt: new Date("2025-02-06") },
  // Delhi Monthly committee
  { customerId: cPooja.id, collectorId: colSunil.id, branchId: bDelhi.id, committeeId: comDelMonthly.id, amount: "10000.00", paymentMode: "bank",  receiptNumber: "RCP-DEL-0001", collectedAt: new Date("2025-03-05") },
  { customerId: cManoj.id, collectorId: colSunil.id, branchId: bDelhi.id, committeeId: comDelMonthly.id, amount: "10000.00", paymentMode: "cash",  receiptNumber: "RCP-DEL-0002", collectedAt: new Date("2025-03-06") },
  { customerId: cAnita.id, collectorId: colSunil.id, branchId: bDelhi.id, committeeId: comDelMonthly.id, amount: "10000.00", paymentMode: "upi",   receiptNumber: "RCP-DEL-0003", collectedAt: new Date("2025-03-07") },
  // Bangalore Weekly committee
  { customerId: cSuresh.id, collectorId: colLakshmi.id, branchId: bBangalore.id, committeeId: comBlrWeekly.id, amount: "1000.00", paymentMode: "cash",  receiptNumber: "RCP-BLR-0001", collectedAt: new Date("2025-01-10") },
  { customerId: cMeera.id,  collectorId: colLakshmi.id, branchId: bBangalore.id, committeeId: comBlrWeekly.id, amount: "1000.00", paymentMode: "upi",   receiptNumber: "RCP-BLR-0002", collectedAt: new Date("2025-01-10") },
  { customerId: cKiran.id,  collectorId: colLakshmi.id, branchId: bBangalore.id, committeeId: comBlrWeekly.id, amount: "1000.00", paymentMode: "cash",  receiptNumber: "RCP-BLR-0003", collectedAt: new Date("2025-01-10") },
  { customerId: cPriya.id,  collectorId: colLakshmi.id, branchId: bBangalore.id, committeeId: comBlrWeekly.id, amount: "1000.00", paymentMode: "card",  receiptNumber: "RCP-BLR-0004", collectedAt: new Date("2025-01-10") },
  // Loan EMI collections
  { customerId: cAmit.id,  collectorId: colVikram.id, branchId: bMumbai.id,    amount: "4583.00", paymentMode: "cash", receiptNumber: "RCP-EMI-0001", notes: "Loan EMI - Oct",  collectedAt: new Date("2024-11-01") },
  { customerId: cAmit.id,  collectorId: colVikram.id, branchId: bMumbai.id,    amount: "4583.00", paymentMode: "upi",  receiptNumber: "RCP-EMI-0002", notes: "Loan EMI - Nov",  collectedAt: new Date("2024-12-01") },
  { customerId: cAmit.id,  collectorId: colVikram.id, branchId: bMumbai.id,    amount: "4583.00", paymentMode: "cash", receiptNumber: "RCP-EMI-0003", notes: "Loan EMI - Dec",  collectedAt: new Date("2025-01-01") },
  { customerId: cPooja.id, collectorId: colSunil.id,  branchId: bDelhi.id,     amount: "5030.00", paymentMode: "bank", receiptNumber: "RCP-EMI-0004", notes: "Loan EMI - Jan",  collectedAt: new Date("2025-01-05") },
  { customerId: cPooja.id, collectorId: colSunil.id,  branchId: bDelhi.id,     amount: "5030.00", paymentMode: "bank", receiptNumber: "RCP-EMI-0005", notes: "Loan EMI - Feb",  collectedAt: new Date("2025-02-05") },
  { customerId: cPooja.id, collectorId: colSunil.id,  branchId: bDelhi.id,     amount: "5030.00", paymentMode: "upi",  receiptNumber: "RCP-EMI-0006", notes: "Loan EMI - Mar",  collectedAt: new Date("2025-03-05") },
  { customerId: cKiran.id, collectorId: colLakshmi.id, branchId: bBangalore.id, amount: "3375.00", paymentMode: "cash", receiptNumber: "RCP-EMI-0007", notes: "Loan EMI - Sep",  collectedAt: new Date("2024-09-01") },
]);
console.log("  ✓ Created 21 collections.");

// ─── 9. Lotteries ─────────────────────────────────────────────────────────────

console.log("\n── Seeding lotteries");
await db.insert(lotteriesTable).values([
  {
    committeeId: comFestival.id,
    drawDate: "2024-11-01",
    winnerId: cAmit.id,
    prizeAmount: "30000.00",
    status: "completed",
    notes: "Diwali special draw — Amit Kumar won.",
  },
  {
    committeeId: comMumMonthly.id,
    drawDate: "2025-01-01",
    winnerId: cSunita.id,
    prizeAmount: "100000.00",
    status: "completed",
    notes: "January draw — Sunita Patil won.",
  },
  {
    committeeId: comMumMonthly.id,
    drawDate: "2025-02-01",
    winnerId: null,
    prizeAmount: "100000.00",
    status: "scheduled",
    notes: "February draw — pending.",
  },
  {
    committeeId: comDelMonthly.id,
    drawDate: "2025-03-01",
    winnerId: cPooja.id,
    prizeAmount: "120000.00",
    status: "completed",
    notes: "March draw — Pooja Sharma won.",
  },
  {
    committeeId: comBlrWeekly.id,
    drawDate: "2025-01-17",
    winnerId: cMeera.id,
    prizeAmount: "25000.00",
    status: "completed",
    notes: "Week 3 draw — Meera Rao won.",
  },
  {
    committeeId: comBlrWeekly.id,
    drawDate: "2025-01-24",
    winnerId: null,
    prizeAmount: "25000.00",
    status: "scheduled",
  },
]);
console.log("  ✓ Created 6 lotteries.");

console.log("\n✅ Seed complete!\n");
process.exit(0);
