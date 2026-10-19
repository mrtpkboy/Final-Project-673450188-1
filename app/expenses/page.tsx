import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/app/auth";
import ExpenseManager from "@/components/ExpenseManager";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const isAdmin = session.user.role === "ADMIN";

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-xl font-bold tracking-tight">สมุดรายจ่าย</Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ink-soft">
            {session.user.name ?? session.user.email}
            {isAdmin && <span className="ml-2 rounded-full bg-mark px-2 py-0.5 text-xs font-semibold text-ink">ADMIN</span>}
          </span>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="rounded-lg border-[1.5px] border-line bg-white px-3.5 py-1.5 font-medium hover:bg-white/60">ออกจากระบบ</button>
          </form>
        </div>
      </header>

      <ExpenseManager isAdmin={isAdmin} />
    </main>
  );
}
