import { z } from "zod";

export const CATEGORIES = [
  "อาหาร",
  "เดินทาง",
  "ที่พัก",
  "ช้อปปิ้ง",
  "สุขภาพ",
  "บันเทิง",
  "อื่นๆ",
] as const;

// กฎ validation ของ "รายจ่าย" (ใช้ทั้ง POST และ PUT)
export const expenseSchema = z.object({
  title: z
    .string({ required_error: "กรุณากรอกชื่อรายการ" })
    .trim()
    .min(1, "กรุณากรอกชื่อรายการ")
    .max(100, "ชื่อรายการยาวเกิน 100 ตัวอักษร"),
  amount: z.coerce
    .number({ invalid_type_error: "จำนวนเงินต้องเป็นตัวเลข", required_error: "กรุณากรอกจำนวนเงิน" })
    .positive("จำนวนเงินต้องมากกว่า 0")
    .max(10_000_000, "จำนวนเงินสูงสุด 10,000,000 บาท"),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "หมวดหมู่ไม่ถูกต้อง" }) }),
  date: z.coerce.date({ errorMap: () => ({ message: "รูปแบบวันที่ไม่ถูกต้อง" }) }),
  note: z
    .string()
    .trim()
    .max(500, "หมายเหตุยาวเกิน 500 ตัวอักษร")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
