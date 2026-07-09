import { Router, type IRouter } from "express";
import {
  db,
  recoveryTasksTable,
  recoveryCallLogsTable,
  customersTable,
  collectorsTable,
} from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Recovery Tasks
// ---------------------------------------------------------------------------

router.get("/recovery/tasks", async (req, res): Promise<void> => {
  const { branchId, status, priority, collectorId } = req.query;
  const conditions: any[] = [];
  if (branchId) conditions.push(eq(recoveryTasksTable.branchId, parseInt(branchId as string, 10)));
  if (status) conditions.push(eq(recoveryTasksTable.status, status as any));
  if (priority) conditions.push(eq(recoveryTasksTable.priority, priority as any));
  if (collectorId) conditions.push(eq(recoveryTasksTable.assignedCollectorId, parseInt(collectorId as string, 10)));

  let query = db
    .select({
      t: recoveryTasksTable,
      customerName: customersTable.name,
      customerMobile: customersTable.mobile,
      collectorName: collectorsTable.name,
    })
    .from(recoveryTasksTable)
    .leftJoin(customersTable, eq(recoveryTasksTable.customerId, customersTable.id))
    .leftJoin(collectorsTable, eq(recoveryTasksTable.assignedCollectorId, collectorsTable.id))
    .$dynamic();
  if (conditions.length) query = (query as any).where(and(...conditions));
  const rows = await (query as any).orderBy(desc(recoveryTasksTable.createdAt));
  res.json(rows.map((r: any) => ({
    ...r.t,
    customerName: r.customerName,
    customerMobile: r.customerMobile,
    collectorName: r.collectorName,
  })));
});

router.post("/recovery/tasks", async (req, res): Promise<void> => {
  const { customerId, collectionId, loanId, assignedCollectorId, priority, dueDate, overdueAmount, notes, nextFollowUpDate, branchId } = req.body;
  if (!customerId || !branchId) { res.status(400).json({ error: "customerId and branchId required" }); return; }
  const [row] = await db
    .insert(recoveryTasksTable)
    .values({ customerId, collectionId, loanId, assignedCollectorId, priority, dueDate, overdueAmount, notes, nextFollowUpDate, branchId })
    .returning();
  res.status(201).json(row);
});

router.get("/recovery/tasks/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db
    .select({ t: recoveryTasksTable, customerName: customersTable.name, customerMobile: customersTable.mobile, collectorName: collectorsTable.name })
    .from(recoveryTasksTable)
    .leftJoin(customersTable, eq(recoveryTasksTable.customerId, customersTable.id))
    .leftJoin(collectorsTable, eq(recoveryTasksTable.assignedCollectorId, collectorsTable.id))
    .where(eq(recoveryTasksTable.id, id));
  if (!row) { res.status(404).json({ error: "Task not found" }); return; }

  const callLogs = await db.select().from(recoveryCallLogsTable).where(eq(recoveryCallLogsTable.taskId, id)).orderBy(desc(recoveryCallLogsTable.calledAt));

  res.json({ ...row.t, customerName: row.customerName, customerMobile: row.customerMobile, collectorName: row.collectorName, callLogs });
});

router.patch("/recovery/tasks/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status, priority, assignedCollectorId, nextFollowUpDate, lastContactDate, notes, resolutionNotes } = req.body;
  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (assignedCollectorId !== undefined) updateData.assignedCollectorId = assignedCollectorId;
  if (nextFollowUpDate !== undefined) updateData.nextFollowUpDate = nextFollowUpDate;
  if (lastContactDate !== undefined) updateData.lastContactDate = lastContactDate;
  if (notes !== undefined) updateData.notes = notes;
  if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
  if (status === "resolved") updateData.resolvedAt = new Date();

  const [row] = await db.update(recoveryTasksTable).set(updateData).where(eq(recoveryTasksTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(row);
});

// ---------------------------------------------------------------------------
// Call Logs
// ---------------------------------------------------------------------------

router.post("/recovery/tasks/:id/calls", async (req, res): Promise<void> => {
  const taskId = parseInt(req.params.id, 10);
  const { customerId, outcome, notes, nextAction } = req.body;
  if (!customerId) { res.status(400).json({ error: "customerId required" }); return; }
  const [log] = await db
    .insert(recoveryCallLogsTable)
    .values({ taskId, customerId, outcome, notes, nextAction })
    .returning();

  // Update last contact date on task
  await db.update(recoveryTasksTable).set({ lastContactDate: new Date().toISOString().split("T")[0] }).where(eq(recoveryTasksTable.id, taskId));
  res.status(201).json(log);
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

router.get("/recovery/summary", async (req, res): Promise<void> => {
  const [pending] = await db.select({ count: sql<number>`count(*)::int` }).from(recoveryTasksTable).where(eq(recoveryTasksTable.status, "pending"));
  const [inProgress] = await db.select({ count: sql<number>`count(*)::int` }).from(recoveryTasksTable).where(eq(recoveryTasksTable.status, "in_progress"));
  const [resolved] = await db.select({ count: sql<number>`count(*)::int` }).from(recoveryTasksTable).where(eq(recoveryTasksTable.status, "resolved"));
  const [escalated] = await db.select({ count: sql<number>`count(*)::int` }).from(recoveryTasksTable).where(eq(recoveryTasksTable.status, "escalated"));
  const [critical] = await db.select({ count: sql<number>`count(*)::int` }).from(recoveryTasksTable).where(eq(recoveryTasksTable.priority, "critical"));

  res.json({
    pending: pending?.count ?? 0,
    inProgress: inProgress?.count ?? 0,
    resolved: resolved?.count ?? 0,
    escalated: escalated?.count ?? 0,
    critical: critical?.count ?? 0,
  });
});

export default router;
