import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/app/lib/prisma";
import { expenseSchema } from "@/app/lib/expense-schema";
import { json, requireUser, unauthorized, validationError } from "@/app/lib/api";

// GET /api/expenses?q=&category=&from=&to=&page=&pageSize=
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const category = sp.get("category");
  const from = sp.get("from");
  const to = sp.get("to");
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize")) || 10));

  const where: Prisma.ExpenseWhereInput = {};
  // USER/STAFF เห็นเฉพาะของตัวเอง, ADMIN เห็นทั้งหมด
  if (user.role !== "ADMIN") where.userId = user.id;
  if (q) {
    where.OR = [{ title: { contains: q } }, { note: { contains: q } }];
  }
  if (category) where.category = category;
  if (from || to) {
    where.date = {};
    if (from && !isNaN(Date.parse(from))) where.date.gte = new Date(from);
    if (to && !isNaN(Date.parse(to))) where.date.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const [data, total, sum, byCat] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.expense.groupBy({ by: ["category"], where, _sum: { amount: true } }),
  ]);

  return json({
    data,
    pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    summary: {
      totalAmount: sum._sum.amount ?? 0,
      byCategory: byCat
        .map((c) => ({ category: c.category, amount: c._sum.amount ?? 0 }))
        .sort((a, b) => b.amount - a.amount),
    },
  });
}

// POST /api/expenses
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "ต้องส่งข้อมูลเป็น JSON" }, 400);

  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const created = await prisma.expense.create({
    data: { ...parsed.data, userId: user.id },
  });
  return json(created, 201);
}
