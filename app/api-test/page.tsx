import Link from "next/link";
import { auth } from "@/app/auth";
import ApiTester from "@/components/ApiTester";

// หน้าทดสอบ REST API บนเว็บ (แทนการใช้ curl / Postman)
export default async function ApiTestPage() {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? session.user.email ?? "", email: session.user.email ?? "", role: session.user.role }
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-xl font-bold tracking-tight">สมุดรายจ่าย</Link>
        <nav className="flex items-center gap-4 text-sm">
          {user && <Link href="/expenses" className="text-ink-soft hover:underline">กลับไปสมุดรายจ่าย</Link>}
          {!user && (
            <Link href="/login" className="rounded-lg border-[1.5px] border-line bg-white px-3.5 py-1.5 font-medium hover:bg-white/60">
              เข้าสู่ระบบ
            </Link>
          )}
        </nav>
      </header>

      <ApiTester user={user} />
    </main>
  );
}
