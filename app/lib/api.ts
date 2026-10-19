import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import prisma from "@/app/lib/prisma";
import type { ZodError } from "zod";

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export const validationError = (err: ZodError) =>
  json({ error: "ข้อมูลไม่ถูกต้อง", fields: err.flatten().fieldErrors }, 422);

// ตรวจสอบสิทธิ์: ต้อง login และ user ต้องมีอยู่จริงในฐานข้อมูล
export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  return user;
}

export const unauthorized = () => json({ error: "กรุณาเข้าสู่ระบบ (401)" }, 401);
