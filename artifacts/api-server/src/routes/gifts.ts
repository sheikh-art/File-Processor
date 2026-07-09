import { Router, type IRouter } from "express";
import {
  db,
  giftCategoriesTable,
  giftInventoryTable,
  giftDistributionsTable,
  customersTable,
  branchesTable,
} from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

// ---------------------------------------------------------------------------
// Gift Categories
// ---------------------------------------------------------------------------

router.get("/gifts/categories", async (req, res): Promise<void> => {
  const { branchId } = req.query;
  let query = db.select().from(giftCategoriesTable).$dynamic();
  if (branchId) query = (query as any).where(eq(giftCategoriesTable.branchId, parseInt(branchId as string, 10)));
  const rows = await (query as any).orderBy(giftCategoriesTable.name);
  res.json(rows);
});

router.post("/gifts/categories", async (req, res): Promise<void> => {
  const { name, description, branchId } = req.body;
  if (!name || !branchId) { res.status(400).json({ error: "name and branchId required" }); return; }
  const [row] = await db.insert(giftCategoriesTable).values({ name, description, branchId }).returning();
  res.status(201).json(row);
});

router.put("/gifts/categories/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { name, description } = req.body;
  const [row] = await db.update(giftCategoriesTable).set({ name, description }).where(eq(giftCategoriesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Category not found" }); return; }
  res.json(row);
});

router.delete("/gifts/categories/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(giftCategoriesTable).where(eq(giftCategoriesTable.id, id));
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Gift Inventory
// ---------------------------------------------------------------------------

router.get("/gifts/inventory", async (req, res): Promise<void> => {
  const { branchId, categoryId, status, search } = req.query;
  let query = db
    .select({ g: giftInventoryTable, categoryName: giftCategoriesTable.name })
    .from(giftInventoryTable)
    .leftJoin(giftCategoriesTable, eq(giftInventoryTable.categoryId, giftCategoriesTable.id))
    .$dynamic();

  const conditions: any[] = [];
  if (branchId) conditions.push(eq(giftInventoryTable.branchId, parseInt(branchId as string, 10)));
  if (categoryId) conditions.push(eq(giftInventoryTable.categoryId, parseInt(categoryId as string, 10)));
  if (status) conditions.push(eq(giftInventoryTable.status, status as any));
  if (search) conditions.push(ilike(giftInventoryTable.name, `%${search}%`));
  if (conditions.length) query = (query as any).where(and(...conditions));

  const rows = await (query as any).orderBy(desc(giftInventoryTable.createdAt));
  res.json(rows.map((r: any) => ({ ...r.g, categoryName: r.categoryName })));
});

router.post("/gifts/inventory", async (req, res): Promise<void> => {
  const { categoryId, name, description, estimatedValue, quantityTotal, branchId, addedAt } = req.body;
  if (!categoryId || !name || !branchId) { res.status(400).json({ error: "categoryId, name, branchId required" }); return; }
  const qty = parseInt(quantityTotal ?? "0", 10);
  const [row] = await db
    .insert(giftInventoryTable)
    .values({ categoryId, name, description, estimatedValue, quantityTotal: qty, quantityAvailable: qty, branchId, addedAt })
    .returning();
  res.status(201).json(row);
});

router.get("/gifts/inventory/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db
    .select({ g: giftInventoryTable, categoryName: giftCategoriesTable.name })
    .from(giftInventoryTable)
    .leftJoin(giftCategoriesTable, eq(giftInventoryTable.categoryId, giftCategoriesTable.id))
    .where(eq(giftInventoryTable.id, id));
  if (!row) { res.status(404).json({ error: "Gift not found" }); return; }
  res.json({ ...row.g, categoryName: row.categoryName });
});

router.put("/gifts/inventory/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { name, description, estimatedValue, quantityTotal, quantityAvailable, status } = req.body;
  const [row] = await db
    .update(giftInventoryTable)
    .set({ name, description, estimatedValue, quantityTotal, quantityAvailable, status })
    .where(eq(giftInventoryTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Gift not found" }); return; }
  res.json(row);
});

// ---------------------------------------------------------------------------
// Gift Distributions
// ---------------------------------------------------------------------------

router.get("/gifts/distributions", async (req, res): Promise<void> => {
  const { branchId, customerId, status } = req.query;
  const conditions: any[] = [];
  if (branchId) conditions.push(eq(giftDistributionsTable.branchId, parseInt(branchId as string, 10)));
  if (customerId) conditions.push(eq(giftDistributionsTable.customerId, parseInt(customerId as string, 10)));
  if (status) conditions.push(eq(giftDistributionsTable.status, status as any));

  let query = db
    .select({
      d: giftDistributionsTable,
      giftName: giftInventoryTable.name,
      customerName: customersTable.name,
    })
    .from(giftDistributionsTable)
    .leftJoin(giftInventoryTable, eq(giftDistributionsTable.giftId, giftInventoryTable.id))
    .leftJoin(customersTable, eq(giftDistributionsTable.customerId, customersTable.id))
    .$dynamic();

  if (conditions.length) query = (query as any).where(and(...conditions));
  const rows = await (query as any).orderBy(desc(giftDistributionsTable.distributionDate));
  res.json(rows.map((r: any) => ({ ...r.d, giftName: r.giftName, customerName: r.customerName })));
});

router.post("/gifts/distributions", async (req, res): Promise<void> => {
  const { giftId, customerId, committeeId, lotteryId, quantity, distributionDate, notes, branchId } = req.body;
  if (!giftId || !customerId || !distributionDate || !branchId) {
    res.status(400).json({ error: "giftId, customerId, distributionDate, branchId required" });
    return;
  }
  const qty = parseInt(quantity ?? "1", 10);

  // Deduct from inventory
  const [gift] = await db.select().from(giftInventoryTable).where(eq(giftInventoryTable.id, giftId));
  if (!gift) { res.status(404).json({ error: "Gift not found" }); return; }
  const avail = gift.quantityAvailable ?? 0;
  if (Number(avail) < qty) { res.status(400).json({ error: "Insufficient stock" }); return; }

  const [dist] = await db
    .insert(giftDistributionsTable)
    .values({ giftId, customerId, committeeId, lotteryId, quantity: qty, distributionDate, notes, branchId })
    .returning();

  await db
    .update(giftInventoryTable)
    .set({
      quantityAvailable: Number(avail) - qty,
      quantityDistributed: Number(gift.quantityDistributed ?? 0) + qty,
    })
    .where(eq(giftInventoryTable.id, giftId));

  res.status(201).json(dist);
});

router.patch("/gifts/distributions/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { status, returnNotes } = req.body;
  const [dist] = await db
    .update(giftDistributionsTable)
    .set({ status, returnNotes, isReturned: status === "returned", returnDate: status === "returned" ? new Date().toISOString().split("T")[0] : undefined })
    .where(eq(giftDistributionsTable.id, id))
    .returning();
  if (!dist) { res.status(404).json({ error: "Distribution not found" }); return; }

  // If returned, restore inventory
  if (status === "returned") {
    const [gift] = await db.select().from(giftInventoryTable).where(eq(giftInventoryTable.id, dist.giftId));
    if (gift) {
      await db.update(giftInventoryTable).set({
        quantityAvailable: Number(gift.quantityAvailable ?? 0) + dist.quantity,
        quantityDistributed: Math.max(0, Number(gift.quantityDistributed ?? 0) - dist.quantity),
      }).where(eq(giftInventoryTable.id, dist.giftId));
    }
  }
  res.json(dist);
});

router.get("/gifts/summary", async (req, res): Promise<void> => {
  const [totalItems] = await db.select({ count: sql<number>`count(*)::int` }).from(giftInventoryTable);
  const [totalDistributed] = await db.select({ count: sql<number>`count(*)::int` }).from(giftDistributionsTable).where(eq(giftDistributionsTable.status, "given"));
  const [pendingDistribution] = await db.select({ count: sql<number>`count(*)::int` }).from(giftDistributionsTable).where(eq(giftDistributionsTable.status, "pending"));
  const [totalCategories] = await db.select({ count: sql<number>`count(*)::int` }).from(giftCategoriesTable);

  res.json({
    totalItems: totalItems?.count ?? 0,
    totalDistributed: totalDistributed?.count ?? 0,
    pendingDistribution: pendingDistribution?.count ?? 0,
    totalCategories: totalCategories?.count ?? 0,
  });
});

export default router;
