import { Router, type IRouter } from "express";
import {
  db,
  interestAccountsTable,
  interestTransactionsTable,
  customersTable,
  branchesTable,
} from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Interest Accounts
// ---------------------------------------------------------------------------

router.get("/interests/accounts", async (req, res): Promise<void> => {
  const { branchId, customerId, status } = req.query;
  const conditions: any[] = [];
  if (branchId) conditions.push(eq(interestAccountsTable.branchId, parseInt(branchId as string, 10)));
  if (customerId) conditions.push(eq(interestAccountsTable.customerId, parseInt(customerId as string, 10)));
  if (status) conditions.push(eq(interestAccountsTable.status, status as any));

  let query = db
    .select({ a: interestAccountsTable, customerName: customersTable.name, customerMobile: customersTable.mobile })
    .from(interestAccountsTable)
    .leftJoin(customersTable, eq(interestAccountsTable.customerId, customersTable.id))
    .$dynamic();
  if (conditions.length) query = (query as any).where(and(...conditions));
  const rows = await (query as any).orderBy(desc(interestAccountsTable.createdAt));
  res.json(rows.map((r: any) => ({ ...r.a, customerName: r.customerName, customerMobile: r.customerMobile })));
});

router.post("/interests/accounts", async (req, res): Promise<void> => {
  const { customerId, principalAmount, interestRate, startDate, endDate, branchId, notes } = req.body;
  if (!customerId || !principalAmount || !interestRate || !startDate || !branchId) {
    res.status(400).json({ error: "customerId, principalAmount, interestRate, startDate, branchId required" });
    return;
  }
  const [row] = await db
    .insert(interestAccountsTable)
    .values({ customerId, principalAmount, interestRate, startDate, endDate, branchId, notes })
    .returning();
  res.status(201).json(row);
});

router.get("/interests/accounts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db
    .select({ a: interestAccountsTable, customerName: customersTable.name, customerMobile: customersTable.mobile })
    .from(interestAccountsTable)
    .leftJoin(customersTable, eq(interestAccountsTable.customerId, customersTable.id))
    .where(eq(interestAccountsTable.id, id));
  if (!row) { res.status(404).json({ error: "Interest account not found" }); return; }
  res.json({ ...row.a, customerName: row.customerName, customerMobile: row.customerMobile });
});

router.put("/interests/accounts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { principalAmount, interestRate, endDate, status, notes } = req.body;
  const [row] = await db
    .update(interestAccountsTable)
    .set({ principalAmount, interestRate, endDate, status, notes })
    .where(eq(interestAccountsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Interest account not found" }); return; }
  res.json(row);
});

// ---------------------------------------------------------------------------
// Interest Transactions
// ---------------------------------------------------------------------------

router.get("/interests/transactions", async (req, res): Promise<void> => {
  const { accountId, customerId, branchId, year, month } = req.query;
  const conditions: any[] = [];
  if (accountId) conditions.push(eq(interestTransactionsTable.accountId, parseInt(accountId as string, 10)));
  if (customerId) conditions.push(eq(interestTransactionsTable.customerId, parseInt(customerId as string, 10)));
  if (branchId) conditions.push(eq(interestTransactionsTable.branchId, parseInt(branchId as string, 10)));
  if (year) conditions.push(eq(interestTransactionsTable.year, parseInt(year as string, 10)));
  if (month) conditions.push(eq(interestTransactionsTable.month, parseInt(month as string, 10)));

  let query = db
    .select({ t: interestTransactionsTable, customerName: customersTable.name })
    .from(interestTransactionsTable)
    .leftJoin(customersTable, eq(interestTransactionsTable.customerId, customersTable.id))
    .$dynamic();
  if (conditions.length) query = (query as any).where(and(...conditions));
  const rows = await (query as any).orderBy(desc(interestTransactionsTable.createdAt));
  res.json(rows.map((r: any) => ({ ...r.t, customerName: r.customerName })));
});

router.post("/interests/transactions", async (req, res): Promise<void> => {
  const { accountId, customerId, type, amount, month, year, paymentDate, receiptNumber, notes, branchId } = req.body;
  if (!accountId || !customerId || !type || !amount || !month || !year || !branchId) {
    res.status(400).json({ error: "accountId, customerId, type, amount, month, year, branchId required" });
    return;
  }
  const [tx] = await db
    .insert(interestTransactionsTable)
    .values({ accountId, customerId, type, amount, month, year, paymentDate, receiptNumber, notes, branchId })
    .returning();

  // Update account totals
  if (type === "credit") {
    await db.execute(sql`
      UPDATE interest_accounts 
      SET total_interest_paid = total_interest_paid + ${parseFloat(amount)},
          pending_interest = GREATEST(0, pending_interest - ${parseFloat(amount)})
      WHERE id = ${accountId}
    `);
  }
  res.status(201).json(tx);
});

// ---------------------------------------------------------------------------
// Interest Summary
// ---------------------------------------------------------------------------

router.get("/interests/summary", async (req, res): Promise<void> => {
  const [activeAccounts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(interestAccountsTable)
    .where(eq(interestAccountsTable.status, "active"));
  const [totalPrincipal] = await db
    .select({ sum: sql<string>`coalesce(sum(principal_amount::numeric),0)` })
    .from(interestAccountsTable)
    .where(eq(interestAccountsTable.status, "active"));
  const [totalPending] = await db
    .select({ sum: sql<string>`coalesce(sum(pending_interest::numeric),0)` })
    .from(interestAccountsTable)
    .where(eq(interestAccountsTable.status, "active"));
  const [totalPaid] = await db
    .select({ sum: sql<string>`coalesce(sum(total_interest_paid::numeric),0)` })
    .from(interestAccountsTable);

  res.json({
    activeAccounts: activeAccounts?.count ?? 0,
    totalPrincipal: parseFloat(totalPrincipal?.sum ?? "0"),
    totalPendingInterest: parseFloat(totalPending?.sum ?? "0"),
    totalInterestPaid: parseFloat(totalPaid?.sum ?? "0"),
  });
});

export default router;
