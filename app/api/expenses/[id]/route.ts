import type { NextRequest } from "next/server";
import prisma from "@/app/lib/prisma";
import { expenseSchema } from "@/app/lib/expense-schema";
import { json, requireUser, unauthorized, validationError } from "@/app/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// หา record + ตรวจสิทธิ์ (เจ้าของ หรือ ADMIN เท่านั้น)
async function load(id: string) {
  const user = await requireUser();
  if (!user) return { res: unauthorized() };
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return { res: json({ error: "ไม่พบข้อมูล (404)" }, 404) };
  if (user.role !== "ADMIN" && expense.userId !== user.id) {
    return { res: json({ error: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (403)" }, 403) };
  }
  return { expense };
}

// GET /api/expenses/:id
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const r = await load(id);
  return r.res ?? json(r.expense);
}

// PUT /api/expenses/:id
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const r = await load(id);
  if (r.res) return r.res;

  const body = await req.json().catch(() => null);
  if (!body) return json({ error: "ต้องส่งข้อมูลเป็น JSON" }, 400);

  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const updated = await prisma.expense.update({ where: { id }, data: parsed.data });
  return json(updated);
}

// DELETE /api/expenses/:id
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const r = await load(id);
  if (r.res) return r.res;

  await prisma.expense.delete({ where: { id } });
  return json({ message: "ลบข้อมูลเรียบร้อย" });
}
