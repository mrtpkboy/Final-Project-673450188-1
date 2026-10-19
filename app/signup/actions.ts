"use server";

import bcrypt from "bcryptjs";
import prisma from "@/app/lib/prisma";

export type SignUpState = {
  error?: string;
  success?: boolean;
};

export async function signUp(
  prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  // ตรวจสอบข้อมูล
  if (!name || !email || !password || !confirmPassword) {
    return {
      error: "กรุณากรอกข้อมูลให้ครบถ้วน",
    };
  }

  // ตรวจสอบ password
  if (password.length < 6) {
    return {
      error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "รหัสผ่านไม่ตรงกัน",
    };
  }

  // ตรวจสอบ email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      error: "รูปแบบ Email ไม่ถูกต้อง",
    };
  }

  // ตรวจสอบว่ามี User อยู่แล้วหรือไม่
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return {
      error: "Email นี้ถูกใช้งานแล้ว",
    };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // สร้าง User
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,

      // สำคัญ: ผู้สมัครใหม่จะเป็น USER เสมอ
      // (ต้นฉบับใน repo ตั้งเป็น "ADMIN" ซึ่งไม่ปลอดภัย จึงแก้เป็น USER)
      role: "USER",
    },
  });

  return {
    success: true,
  };
}
