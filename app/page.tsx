import Link from "next/link";
import { auth, signOut } from "@/app/auth";

const btnMain = "rounded-xl bg-baht px-6 py-3 font-semibold text-white hover:bg-baht-dark";
const btnSub = "rounded-xl border-[1.5px] border-ink/20 bg-white px-6 py-3 font-semibold hover:bg-white/60";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-8">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">สมุดรายจ่าย</span>
        {session?.user && (
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="text-sm text-ink-soft hover:underline">ออกจากระบบ</button>
          </form>
        )}
      </header>

      <div className="grid flex-1 items-center gap-12 py-12 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            เงินไปไหนบ้าง<br />จดไว้แล้วจะรู้
          </h1>
          <p className="mt-4 max-w-md text-lg text-ink-soft">
            บันทึกรายจ่ายทุกวัน ค้นหาย้อนหลังได้ กรองตามหมวดหมู่หรือช่วงวันที่ และเห็นยอดรวมทันที
          </p>

          {session?.user ? (
            <div className="mt-8">
              <p className="mb-4 text-ink-soft">สวัสดี {session.user.name ?? session.user.email}</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/expenses" className={btnMain}>เปิดสมุดรายจ่าย</Link>
                {session.user.role === "ADMIN" && <Link href="/admin" className={btnSub}>หน้า Admin</Link>}
              </div>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className={btnMain}>เริ่มใช้งานฟรี</Link>
              <Link href="/login" className={btnSub}>เข้าสู่ระบบ</Link>
            </div>
          )}
        </div>

        <div className="receipt mb-6 rotate-[1.5deg] p-7 shadow-xl">
          <p className="text-sm text-ink-soft">ยอดรวมสัปดาห์นี้</p>
          <p className="num mt-1 inline-block bg-mark px-2 text-5xl font-bold">1,849.00 ฿</p>
          <div className="mt-6 space-y-3">
            {[["ข้าวมันไก่", "60.00"], ["ค่าแท็กซี่", "180.00"], ["ค่าหอพัก", "1,500.00"], ["ยาแก้หวัด", "109.00"]].map(([n, a]) => (
              <div key={n} className="flex items-end"><span>{n}</span><span className="leader" /><span className="num font-medium">{a}</span></div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
