"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import AuthShell from "@/components/AuthShell";
import { signUp, type SignUpState } from "@/app/signup/actions";

const initialState: SignUpState = {};

const fields = [
  { id: "name", label: "ชื่อ", type: "text", placeholder: "ชื่อของคุณ" },
  { id: "email", label: "อีเมล", type: "email", placeholder: "you@example.com" },
  { id: "password", label: "รหัสผ่าน", type: "password", placeholder: "อย่างน้อย 6 ตัวอักษร" },
  { id: "confirmPassword", label: "ยืนยันรหัสผ่าน", type: "password", placeholder: "กรอกรหัสผ่านอีกครั้ง" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signUp, initialState);

  useEffect(() => {
    if (state.success) router.push("/login?registered=1");
  }, [state.success, router]);

  return (
    <AuthShell
      title="สมัครสมาชิก"
      subtitle="สร้างบัญชีเพื่อเริ่มจดรายจ่าย"
      footer={
        <>
          มีบัญชีอยู่แล้ว?
          <Link href="/login" className="ml-1 font-semibold text-baht-dark hover:underline">เข้าสู่ระบบ</Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        {fields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="mb-1 block text-sm font-medium">{f.label}</label>
            <input id={f.id} name={f.id} type={f.type} placeholder={f.placeholder} className="field"
              minLength={f.type === "password" ? 6 : undefined} required />
          </div>
        ))}

        {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-danger">{state.error}</p>}

        <button type="submit" disabled={pending}
          className="w-full rounded-xl bg-baht px-4 py-3 font-semibold text-white hover:bg-baht-dark disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
        </button>
      </form>
    </AuthShell>
  );
}
